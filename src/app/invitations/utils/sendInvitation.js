const config = require('./../../../infrastructure/config');
const NotificationClient = require('login.dfe.notifications.client');
const { getServiceById } = require('./../../../infrastructure/applications');

const sendInvitation = async (invitation) => {
  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  if (invitation.oldCredentials) { //} && invitation.oldCredentials.source.toUpperCase() === 'EAS') {
    await notificationClient.sendMigrationInvitation(
      invitation.email, invitation.firstName, invitation.lastName, invitation.id, invitation.code);
    return;
  }

  const client = invitation.origin ? await getServiceById(invitation.origin.clientId) : undefined;
  let friendlyName;
  let digipassRequired = false;
  if (client) {
    friendlyName = client.name;
    digipassRequired = client.relyingParty.params ? client.relyingParty.params.digipassRequired : false;
  }

  await notificationClient.sendInvitation(
    invitation.email, invitation.firstName, invitation.lastName, invitation.id, invitation.code,
    friendlyName, digipassRequired, invitation.selfStarted, invitation.overrides, invitation.approverEmail, invitation.orgName, invitation.isApprover);
};

module.exports = sendInvitation;
