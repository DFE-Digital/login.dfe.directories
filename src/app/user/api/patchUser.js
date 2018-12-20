const { find, update } = require('./../adapter');
const { safeUser } = require('./../../../utils');
const config = require('./../../../infrastructure/config');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const allowablePatchProperties = ['given_name', 'family_name', 'email', 'phone_number', 'legacyUsernames'];
const allowablePropertiesMessage = allowablePatchProperties.concat();

const validateRequestData = (req) => {
  const keys = Object.keys(req.body);
  if (keys.length === 0) {
    return `Must specify at least one property to update. Allowed properties ${allowablePropertiesMessage}`
  }

  const errorMessages = keys.map((key) => {
    if (!allowablePatchProperties.find(x => x === key)) {
      return `Unpatchable property ${key}. Allowed properties ${allowablePropertiesMessage}`
    }
    return null;
  });
  return errorMessages.find(x => x !== null);
};

const patchUser = async (req, res) => {
  // Get user
  const user = await find(req.params.id, req.header('x-correlation-id'));
  if (!user) {
    return res.status(404).send();
  }

  const userModel = safeUser(user);

  // Check request is valid
  const validationErrorMessage = validateRequestData(req);
  if (validationErrorMessage) {
    return res.status(400).send(validationErrorMessage);
  }

  // Patch user
  const updatedUser = Object.assign(userModel, req.body);
  await update(updatedUser.sub, updatedUser.given_name, updatedUser.family_name,
    updatedUser.email, updatedUser.phone_number, updatedUser.legacyUsernames, req.header('x-correlation-id'));

  const serviceNotificationsClient = new ServiceNotificationsClient({
    connectionString: config.notifications.connectionString,
  });
  await serviceNotificationsClient.notifyUserUpdated(safeUser(updatedUser));

  return res.status(202).send();
};

module.exports = patchUser;
