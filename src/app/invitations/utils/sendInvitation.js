const config = require('./../../../infrastructure/config');
const NotificationClient = require('login.dfe.notifications.client');
const { getOidcClientById } = require('./../../../infrastructure/hotConfig');

const sendInvitation = async (invitation) => {
  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  if (invitation.oldCredentials && invitation.oldCredentials.source.toUpperCase() === 'EAS') {
    await notificationClient.sendMigrationInvitation(
      invitation.email, invitation.firstName, invitation.lastName, invitation.id, invitation.code);
    return;
  }

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

module.exports = sendInvitation;
