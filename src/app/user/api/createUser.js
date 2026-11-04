const {
  ServiceNotificationsClient,
  NotificationClient,
} = require("login.dfe.jobs-client");
const { findByUsername, create, findByEntraOid } = require("../adapter");
const logger = require("../../../infrastructure/logger");
const config = require("../../../infrastructure/config");
const { safeUser } = require("../../../utils");

const genericEmailStrings =
  config.notifications.genericEmailStrings.map?.((string) =>
    string.toUpperCase?.(),
  ) ?? [];

const createUser = async (req, res) => {
  const correlationId = req.header("x-correlation-id");

  try {
    const {
      email,
      password,
      entraOid,
      firstName,
      lastName,
      legacy_username,
      phone_number,
    } = req.body;

    if (
      !email ||
      !firstName ||
      !lastName ||
      (!password && !entraOid) ||
      (password && entraOid)
    ) {
      return res.status(400).send();
    }

    // A request that matches an existing row on BOTH email and entra_oid is the
    // same Entra identity retrying (e.g. a concurrent or repeated token issuance
    // for one registration), not a conflict - return the existing user so the
    // caller can link to it instead of failing and leaving an orphaned Entra
    // account. Anything else is a genuine conflict.
    const isSameEntraIdentity = (user) =>
      !!entraOid &&
      user.entra_oid?.toLowerCase() === entraOid.toLowerCase() &&
      user.email?.toLowerCase() === email.toLowerCase();

    const existingUser = await findByUsername(email, correlationId);

    if (existingUser) {
      if (isSameEntraIdentity(existingUser)) {
        logger.info(
          `User '${existingUser.sub}' already exists for this email and entraOid, returning the existing record (correlationId: '${correlationId}')`,
          { correlationId },
        );
        return res.send(safeUser(existingUser));
      }
      logger.error(
        `Unable to create the user as the email is already associated with user '${existingUser.sub}' (entraOid supplied: ${!!entraOid}, correlationId: '${correlationId}')`,
        { correlationId },
      );
      return res.status(409).send();
    }

    if (entraOid) {
      const existingUserWithEntraOid = await findByEntraOid(entraOid);
      if (existingUserWithEntraOid) {
        logger.error(
          `Unable to create the user as the entraOid is already associated with user '${existingUserWithEntraOid.sub}' (correlationId: '${correlationId}')`,
          { correlationId },
        );
        return res.status(409).send();
      }
    }

    const user = await create(
      email,
      password,
      firstName,
      lastName,
      legacy_username,
      phone_number,
      req.header("x-correlation-id"),
      entraOid,
    );

    if (config.toggles && config.toggles.notificationsEnabled) {
      const serviceNotificationsClient = new ServiceNotificationsClient({
        connectionString: config.notifications.connectionString,
      });
      const jobId = await serviceNotificationsClient.notifyUserUpdated(
        safeUser(user),
      );
      logger.info(
        `Send user updated notification for ${user.sub} with job id ${jobId} (reason: create)`,
        { correlationId },
      );
    }

    /*
      Checks if the user's email username could possibly be generic, if it is we generate a support request to
      review the account. This is to avoid false positives blocking the account creation journey but still ensures
      we catch and deactivate generic emails according to our Ts&Cs.
    */
    const emailUsername = email.toUpperCase().split("@")[0];
    if (genericEmailStrings.some((string) => emailUsername.includes(string))) {
      const notificationClient = new NotificationClient({
        connectionString: config.notifications.connectionString,
      });
      logger.info(
        `User with id [${user.sub}] has a potentially generic email address. Creating a support request to review it.`,
        { correlationId },
      );
      await notificationClient.sendSupportRequest(
        "",
        config.notifications.supportTeamEmail,
        undefined,
        "potential-generic-email-address",
        undefined,
        undefined,
        undefined,
        `New user has a potentially generic email address, please review the user: ${email} (${firstName} ${lastName}).`,
      );
    }

    return res.send(safeUser(user));
  } catch (e) {
    logger.error(e, { correlationId });
    res.status(500).send(e);
  }
};

module.exports = createUser;
