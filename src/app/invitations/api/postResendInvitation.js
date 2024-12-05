const logger = require("../../../infrastructure/logger");
const config = require("../../../infrastructure/config");
const sendInvitation = require("../utils/sendInvitation");
const { generateInvitationCode } = require("../utils");
const storage = require("../data");

const post = async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).send();
      return;
    }
    let invitation = await storage.getUserInvitation(
      req.params.id,
      req.header("x-correlation-id"),
    );
    if (!invitation) {
      res.status(404).send();
      return;
    }

    invitation.code = generateInvitationCode();
    invitation.codeMetaData = JSON.stringify({
      codeExpiry: new Date().toISOString(),
    });

    logger.audit({
      type: "invitation-code",
      subType: "post-resend-invitation",
      env: config.hostingEnvironment.env,
      application: config.loggerSettings.applicationName,
      message: `Resend verify code ${invitation.code} for invitation id ${invitation.id}`,
    });

    invitation = await storage.updateInvitation(
      invitation,
      req.header("x-correlation-id"),
    );

    await sendInvitation(invitation);
    res.status(200).send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;
