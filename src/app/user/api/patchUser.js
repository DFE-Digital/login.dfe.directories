const { find, update } = require('../adapter');
const logger = require('../../../infrastructure/logger');
const { safeUser } = require('../../../utils');
const config = require('../../../infrastructure/config');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const allowablePatchProperties = ['given_name', 'family_name', 'email', 'job_title', 'phone_number', 'legacyUsernames'];
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

const sendNotification = async (user, updatedUser, correlationId) => {
  if (config.toggles && config.toggles.notificationsEnabled) {
    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    const jobId = await serviceNotificationsClient.notifyUserUpdated(safeUser(updatedUser));
    logger.info(`Send user updated notification for ${user.sub} with job id ${jobId} (reason: patch)`, { correlationId });
  }
};

const patchUser = async (req, res) => {
  const correlationId = req.header('x-correlation-id');

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

  const nameDetailsChanged = ['given_name', 'family_name'].some((property) => property in req.body && req.body[property].trim().toLowerCase() !== user[property].trim().toLowerCase());
  const emailAddrressChanged = !!req.body.email && req.body.email.trim().toLowerCase() !== user.email.trim().toLowerCase();

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

    if (nameDetailsChanged === true) {
      try {
        await req.externalAuth.changeName({
          userId: user.entra_oid,
          firstName: updatedUser.given_name,
          lastName: updatedUser.family_name,
        });
      } catch (error) {
        nameChangeFailed = true;
        logger.error(`patchUser req.externalAuth.changeName failed for user '${user.sub}' with entraOid ${user.entra_oid} for the reason(s) ${error} (correlationId: '${correlationId}')`, { correlationId });
      }
    }

    if (emailAddrressChanged === true) {
      try {
        await req.externalAuth.changeEmail({
          userId: user.entra_oid,
          emailAddress: updatedUser.email,
        });
      } catch (error) {
        emailChangeFailed = true;
        logger.error(`patchUser req.externalAuth.changeEmail failed for user '${user.sub}' with entraOid ${user.entra_oid} for the reason(s) ${error} (correlationId: '${correlationId}')`, { correlationId });
      }
    }

    if (nameChangeFailed === true || emailChangeFailed === true) {
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

      return res.status(500).send({ message: 'Unable to update user record, there was an error with Entra' });
    }
  }

  await sendNotification(user, updatedUser, correlationId);
  return res.status(202).send();
};

module.exports = patchUser;
