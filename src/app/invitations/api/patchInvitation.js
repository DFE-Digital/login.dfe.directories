const config = require('./../../../infrastructure/config');
const { getUserInvitation, updateInvitation } = require('./../data/redisInvitationStorage');
const { generateInvitationCode } = require('./../utils');
const NotificationClient = require('login.dfe.notifications.client');
const { getOidcClientById } = require('./../../../infrastructure/hotConfig');

const patchableProperties = ['email', 'isCompleted', 'deactivated', 'reason'];
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

  const client = invitation.origin ? await getOidcClientById(invitation.origin.clientId) : undefined;
  let friendlyName;
  let digipassRequired = false;
  if (client) {
    friendlyName = client.friendlyName;
    digipassRequired = client.params ? client.params.digipassRequired : false;
  }

  await notificationClient.sendInvitation(
    invitation.email, invitation.firstName, invitation.lastName, invitation.id, invitation.code,
    friendlyName, digipassRequired, invitation.selfStarted);
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
  const emailHasChanged = patchedInvitation.email.toLowerCase() !== invitation.email.toLowerCase();
  if (emailHasChanged) {
    patchedInvitation.code = generateInvitationCode();
  }
  await updateInvitation(patchedInvitation);
  if (emailHasChanged) {
    await sendInvitation(patchedInvitation);
  }

  return res.status(202).send();
};

module.exports = patchInvitation;
