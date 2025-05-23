const { NotificationClient } = require("login.dfe.jobs-client");
const config = require("../../../infrastructure/config");
const logger = require("../../../infrastructure/logger");
const storage = require("../data");
const userStorage = require("../../user/adapter");
const { generateInvitationCode } = require("../utils");
const { getServiceRaw } = require("login.dfe.api-client/services");

const sendInvitation = require("../utils/sendInvitation");

const checkIfExistingUserAndNotifyIfIs = async (invitation) => {
  const account = await userStorage.findByUsername(invitation.email);
  if (account) {
    let friendlyName;
    const client = invitation.origin
      ? await getServiceRaw({ by: { clientId: invitation.origin.clientId } })
      : undefined;
    if (client) {
      friendlyName = client.name;
    }

    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });
    await notificationClient.sendRegisterExistingUser(
      invitation.email,
      invitation.firstName,
      invitation.lastName,
      friendlyName,
      invitation.origin.redirectUri,
    );

    return true;
  }
  return false;
};

const post = async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      res.status(400).send();
      return;
    }

    const requestedInvite = { ...req.body };

    if (await checkIfExistingUserAndNotifyIfIs(requestedInvite)) {
      res.status(202).send();
      return;
    }

    let invitation = await storage.findInvitationForEmail(
      requestedInvite.email,
      true,
      req.header("x-correlation-id"),
    );
    let statusCode = 202;
    if (!invitation) {
      requestedInvite.code = generateInvitationCode();
      requestedInvite.codeMetaData = JSON.stringify({
        codeExpiry: new Date().toISOString(),
      });

      invitation = await storage.createUserInvitation(
        requestedInvite,
        req.header("x-correlation-id"),
      );
      statusCode = 201;
    } else if (invitation) {
      invitation.code = generateInvitationCode();
      invitation.codeMetaData = JSON.stringify({
        codeExpiry: new Date().toISOString(),
      });

      invitation = await storage.updateInvitation(
        invitation,
        req.header("x-correlation-id"),
      );
      statusCode = 201;
    }

    logger.audit({
      type: "invitation-code",
      subType: "post-invitation",
      env: config.hostingEnvironment.env,
      application: config.loggerSettings.applicationName,
      message: `Post verify code ${invitation.code} for invitation id ${invitation.id}`,
    });

    await sendInvitation(invitation);

    res.status(statusCode).send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;
