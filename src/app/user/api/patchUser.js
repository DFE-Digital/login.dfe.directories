const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const {
  updateUserDetailsInSearchIndex,
} = require("login.dfe.api-client/users");
const { find, update } = require("../adapter");
const logger = require("../../../infrastructure/logger");
const { safeUser } = require("../../../utils");
const config = require("../../../infrastructure/config");

const allowablePatchProperties = [
  "given_name",
  "family_name",
  "email",
  "job_title",
  "phone_number",
  "legacyUsernames",
];
const allowablePropertiesMessage = allowablePatchProperties.concat();

const validateRequestData = (req) => {
  const keys = Object.keys(req.body);
  if (keys.length === 0) {
    return `Must specify at least one property to update. Allowed properties ${allowablePropertiesMessage}`;
  }

  const errorMessages = keys.map((key) => {
    if (!allowablePatchProperties.find((x) => x === key)) {
      return `Unpatchable property ${key}. Allowed properties ${allowablePropertiesMessage}`;
    }
    return null;
  });
  return errorMessages.find((x) => x !== null);
};

// Search index update is patch-style (only fields explicitly passed are
// touched, per updateUserDetailsInSearchIndex), so this can't wipe other
// indexed fields. A 404 (user not indexed) resolves the promise with
// `false` rather than throwing, so both outcomes are logged - swallowing
// either would recreate the exact invisible-failure pattern that let this
// bug go unnoticed through two live incidents.
const syncEmailToSearchIndex = async (updatedUser, correlationId) => {
  try {
    const applied = await updateUserDetailsInSearchIndex({
      userId: updatedUser.sub,
      userEmail: updatedUser.email,
      userPendingEmail: null,
      userStatusId: updatedUser.status,
      userFirstName: updatedUser.given_name,
      userLastName: updatedUser.family_name,
    });
    if (!applied) {
      logger.error(
        `patchUser search index update did not apply for user '${updatedUser.sub}' after email change - user may no longer be indexed (correlationId: '${correlationId}')`,
        { correlationId },
      );
    }
  } catch (error) {
    logger.error(
      `patchUser failed to sync confirmed email change to the search index for user '${updatedUser.sub}' - ${error} (correlationId: '${correlationId}')`,
      { correlationId },
    );
  }
};

const sendNotification = async (user, updatedUser, correlationId) => {
  if (config.toggles && config.toggles.notificationsEnabled) {
    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    const jobId = await serviceNotificationsClient.notifyUserUpdated(
      safeUser(updatedUser),
    );
    logger.info(
      `Send user updated notification for ${user.sub} with job id ${jobId} (reason: patch)`,
      { correlationId },
    );
  }
};

const patchUser = async (req, res) => {
  const correlationId = req.header("x-correlation-id");

  // Get user
  const user = await find(req.params.id, correlationId);
  if (!user) {
    return res.status(404).send();
  }

  const userModel = safeUser(user);

  // Check request is valid
  const validationErrorMessage = validateRequestData(req);
  if (validationErrorMessage) {
    return res.status(400).send(validationErrorMessage);
  }

  const nameDetailsChanged = ["given_name", "family_name"].some(
    (property) =>
      property in req.body &&
      req.body[property].trim().toLowerCase() !==
        user[property].trim().toLowerCase(),
  );
  const emailAddressChanged =
    !!req.body.email &&
    req.body.email.trim().toLowerCase() !== user.email.trim().toLowerCase();

  // Tracks whether updatedUser.email ends up actually persisted to
  // directories, so the search index sync below only fires when it's true.
  // Starts as emailAddressChanged and is only ever cleared to false further
  // down, in the one branch where the email field specifically gets
  // reverted (as opposed to a name-only failure, or the MFA-only Entra
  // error, neither of which reverts the email field - see the per-field
  // revert logic below).
  let emailPersisted = emailAddressChanged;

  // Patch user
  const updatedUser = Object.assign(userModel, req.body);
  await update(
    updatedUser.sub,
    updatedUser.given_name,
    updatedUser.family_name,
    updatedUser.email,
    updatedUser.job_title,
    updatedUser.phone_number,
    updatedUser.legacyUsernames,
    correlationId,
  );

  if (!!user.is_entra && !!user.entra_oid) {
    let nameChangeFailed = false;
    let emailChangeFailed = false;
    const errorMessage = {
      type: "error",
      message: "Unable to update user record, there was an error with Entra",
    };

    if (nameDetailsChanged === true) {
      try {
        await req.externalAuth.changeName({
          userId: user.entra_oid,
          firstName: updatedUser.given_name,
          lastName: updatedUser.family_name,
        });
      } catch (error) {
        nameChangeFailed = true;
        logger.error(
          `patchUser req.externalAuth.changeName failed for user '${user.sub}' with entraOid ${user.entra_oid} for the reason(s) ${error} (correlationId: '${correlationId}')`,
          { correlationId },
        );
      }
    }

    if (emailAddressChanged === true) {
      // Changing the email address with Entra results in two calls;
      // 1. to change the identity email and users email
      // 2. to change the MFA email address.
      // If the identity email fails (1) then all changes are reverted, however,
      // if MFA fails (2) then the changes are not reverted.
      try {
        await req.externalAuth.changeEmail({
          userId: user.entra_oid,
          emailAddress: updatedUser.email,
        });
      } catch (error) {
        if (error.name === "ChangeEmailAddressAuthenticationMethodError") {
          errorMessage.type = "ChangeEmailAddressAuthenticationMethodError";
          errorMessage.message =
            "There was an error attempting to change the Entra MFA authentication email";
        }
        emailChangeFailed = true;
        logger.error(
          `patchUser req.externalAuth.changeEmail failed for user '${user.sub}' with entraOid ${user.entra_oid} for the reason(s) ${error} (correlationId: '${correlationId}')`,
          { correlationId },
        );
      }
    }

    if (nameChangeFailed === true || emailChangeFailed === true) {
      // All error types will revert the changes except for ChangeEmailAddressAuthenticationMethodError which is a failure of the MFA change.
      if (errorMessage.type !== "ChangeEmailAddressAuthenticationMethodError") {
        await update(
          updatedUser.sub,
          nameChangeFailed ? user.given_name : updatedUser.given_name,
          nameChangeFailed ? user.family_name : updatedUser.family_name,
          emailChangeFailed ? user.email : updatedUser.email,
          updatedUser.job_title,
          updatedUser.phone_number,
          updatedUser.legacyUsernames,
          correlationId,
        );

        if (emailChangeFailed === true) {
          emailPersisted = false;
        }
      }

      // Even on this 500 path, the email itself may have been persisted as
      // the new value (a name-only failure, or the MFA-only Entra error -
      // see comment on emailPersisted above), so this can't be skipped just
      // because the overall request is failing.
      if (emailPersisted) {
        await syncEmailToSearchIndex(updatedUser, correlationId);
      }

      return res.status(500).send(errorMessage);
    }
  }

  if (emailPersisted) {
    await syncEmailToSearchIndex(updatedUser, correlationId);
  }

  await sendNotification(user, updatedUser, correlationId);
  return res.status(202).send();
};

module.exports = patchUser;
