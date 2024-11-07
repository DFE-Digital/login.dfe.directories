const { NotificationClient } = require('login.dfe.jobs-client');
const config = require('./../../../infrastructure/config');
const { getUserInvitation, updateInvitation } = require('./../data');
const { generateInvitationCode } = require('./../utils');
const { getServiceById } = require('./../../../infrastructure/applications');
const logger = require('../../../infrastructure/logger');

const patchableProperties = ['email', 'isCompleted', 'deactivated', 'reason', 'callbacks'];
const patchablePropertiesMessage = patchableProperties.concat();

const validatePatchProperties = (req) => {
  const patchProperties = req.body ? Object.keys(req.body) : [];
  if (patchProperties.length === 0) {
    return 'No properties specified for patching';
  }

  const propertyError = patchProperties.map((property) => {
    if (!patchableProperties.find(x => x === property)) {
      return `Invalid property patched - ${property}. Patchable properties are ${patchablePropertiesMessage}`;
    }
    return null;
  }).find(x => x !== null);
  if (propertyError) {
    return propertyError;
  }
};
const sendInvitation = async (invitation) => {
  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  const client = invitation.origin ? await getServiceById(invitation.origin.clientId) : undefined;
  let friendlyName;
  if (client) {
    friendlyName = client.name;
  }

  await notificationClient.sendInvitation(
    invitation.email, invitation.firstName, invitation.lastName, invitation.id, invitation.code,
    friendlyName, invitation.selfStarted);
};

const patchInvitation = async (req, res) => {
  const invitation = await getUserInvitation(req.params.id, req.header('x-correlation-id'));
  if (!invitation) {
    return res.status(404).send();
  }

  const requestError = validatePatchProperties(req);
  if (requestError) {
    return res.status(400).send(requestError);
  }

  const patchedInvitation = Object.assign(Object.assign({}, invitation), req.body);

  patchedInvitation.code = generateInvitationCode();
  patchedInvitation.codeMetaData = JSON.stringify({
    codeExpiry: new Date().toISOString(),
  });

  logger.audit({
    type: 'invitation-code',
    subType: 'patch-invitation',
    env: config.hostingEnvironment.env,
    application: config.loggerSettings.applicationName,
    message: `Update verify code ${patchedInvitation.code} for invitation id ${patchedInvitation.id}`,
  });


  await updateInvitation(patchedInvitation);

  await sendInvitation(patchedInvitation);

  return res.status(202).send();
};

module.exports = patchInvitation;
