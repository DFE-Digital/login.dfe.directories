const {
  PublicApiClient,
  ServiceNotificationsClient,
} = require("login.dfe.jobs-client");
const config = require("../../../infrastructure/config");
const logger = require("../../../infrastructure/logger");
const { getUserInvitation, updateInvitation } = require("../data");
const userStorage = require("../../user/adapter");
const { safeUser } = require("../../../utils");

const createUser = async (req, res) => {
  try {
    const invId = req.params.id;
    const { password, entraOid } = req.body;

    if (!invId) {
      return res.status(400).send();
    }
    if ((password && entraOid) || (!password && !entraOid)) {
      return res.status(400).send({
        message: "Provide either password or entraOid, but not both or neither",
      });
    }

    const invitation = await getUserInvitation(
      req.params.id,
      req.header("x-correlation-id"),
    );
    if (!invitation) {
      return res.status(404).send();
    }

    const user = await userStorage.create(
      invitation.email,
      password,
      invitation.firstName,
      invitation.lastName,
      null,
      null,
      req.header("x-correlation-id"),
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

    return res.status(201).send(safeUser(user));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e.message);
  }
};

module.exports = createUser;
