const {
  PublicApiClient,
  ServiceNotificationsClient,
  NotificationClient,
} = require("login.dfe.jobs-client");
const config = require("../../../infrastructure/config");
const logger = require("../../../infrastructure/logger");
const { getUserInvitation, updateInvitation } = require("../data");
const { create } = require("../../user/adapter");
const { safeUser } = require("../../../utils");

const genericEmailStrings =
  config.notifications.genericEmailStrings.map?.((string) =>
    string.toUpperCase?.(),
  ) ?? [];

const createUser = async (req, res) => {
  try {
    const invId = req.params.id;
    const { password, entraOid } = req.body;
    const correlationId = req.header("x-correlation-id");

    if (!invId) {
      return res.status(400).send();
    }
    if ((password && entraOid) || (!password && !entraOid)) {
      return res.status(400).send({
        message: "Provide either password or entraOid, but not both or neither",
      });
    }

    const invitation = await getUserInvitation(req.params.id, correlationId);
    if (!invitation) {
      return res.status(404).send();
    }

    const user = await create(
      invitation.email,
      password,
      invitation.firstName,
      invitation.lastName,
      null,
      null,
      correlationId,
      entraOid,
    );

    const completedInvitation = Object.assign(invitation, {
      isCompleted: true,
      userId: user.id,
    });
    await updateInvitation(completedInvitation);

    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    await serviceNotificationsClient.notifyUserUpdated(safeUser(user));

    const publicApiClient = new PublicApiClient({
      connectionString: config.notifications.connectionString,
    });
    await publicApiClient.sendInvitationComplete(user.id, invitation.callbacks);

    /*
      Checks if the user's email username could possibly be generic, if it is we generate a support request to
      review the account. This is to avoid false positives blocking the account creation journey but still ensures
      we catch and deactivate generic emails according to our Ts&Cs.
    */
    const emailUsername = invitation.email.toUpperCase().split("@")[0];
    if (genericEmailStrings.some((string) => emailUsername.includes(string))) {
      const notificationClient = new NotificationClient({
        connectionString: config.notifications.connectionString,
      });
      logger.info(
        `User with id [${user.id}] has a potentially generic email address. Creating a support request to review it.`,
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
        `New user has a potentially generic email address, please review the user: ${invitation.email} (${invitation.firstName} ${invitation.lastName}).`,
      );
    }

    return res.status(201).send(safeUser(user));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e.message);
  }
};

module.exports = createUser;
