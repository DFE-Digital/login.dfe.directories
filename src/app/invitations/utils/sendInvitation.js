const { NotificationClient } = require("login.dfe.jobs-client");
const config = require("./../../../infrastructure/config");
const { getServiceRaw } = require("login.dfe.api-client/services");
const logger = require("./../../../infrastructure/logger");

const sendInvitation = async (invitation) => {
  try {
    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });

    const client = invitation.origin
      ? await getServiceRaw({ by: { clientId: invitation.origin.clientId } })
      : undefined;
    let friendlyName;
    if (client) {
      friendlyName = client.name;
    }

    await notificationClient.sendInvitation(
      invitation.email,
      invitation.firstName,
      invitation.lastName,
      invitation.id,
      invitation.code,
      friendlyName,
      invitation.selfStarted,
      invitation.overrides,
      invitation.approverEmail,
      invitation.orgName,
      invitation.isApprover,
    );
  } catch (e) {
    logger.error(
      `Error while sending the invitation from directories project. Error- ${e}`,
    );
    throw e;
  }
};

module.exports = sendInvitation;
