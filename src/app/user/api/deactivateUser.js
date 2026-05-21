const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const {
  getUserServicesRaw,
  getUserOrganisationsRaw,
} = require("login.dfe.api-client/users");
const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");
const { safeUser } = require("../../../utils");
const config = require("../../../infrastructure/config");

// The organisations API filters by user.status, so once we deactivate the user
// a live lookup from downstream jobs returns nothing. Capture the snapshot now
// (while the user is still active) and ship it inside the notification.
const captureUserAccessSnapshot = async (userId, correlationId) => {
  try {
    const [userServices, userOrganisations] = await Promise.all([
      getUserServicesRaw({ userId }),
      getUserOrganisationsRaw({ userId }),
    ]);
    return {
      userServices: userServices || [],
      userOrganisations: userOrganisations || [],
    };
  } catch (e) {
    logger.warn(
      `Failed to capture user access snapshot for ${userId} prior to deactivation: ${e.message}`,
      { correlationId },
    );
    return { userServices: [], userOrganisations: [] };
  }
};

const sendNotification = async (user, accessSnapshot, correlationId) => {
  const serviceNotificationsClient = new ServiceNotificationsClient({
    connectionString: config.notifications.connectionString,
  });
  const jobId = await serviceNotificationsClient.notifyUserUpdated({
    ...safeUser(user),
    userServices: accessSnapshot.userServices,
    userOrganisations: accessSnapshot.userOrganisations,
  });
  logger.info(
    `Send user updated notification for ${user.sub} with job id ${jobId} (reason: deactivate)`,
    { correlationId },
  );
};

const changeStatus = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send();
    }
    const correlation_id = req.header("x-correlation-id");

    // MUST run before changeStatus — once status flips to 0 the API hides access.
    const accessSnapshot = await captureUserAccessSnapshot(
      req.params.id,
      correlation_id,
    );

    const user = await userAdapter.changeStatus(
      req.params.id,
      0,
      correlation_id,
    );
    if (!user) {
      return res.status(404).send();
    }
    const reason = req.body.reason;
    if (reason) {
      await userAdapter.createUserStatusChangeReason(
        req.params.id,
        1,
        0,
        reason,
        correlation_id,
      );
    }
    await sendNotification(user, accessSnapshot, correlation_id);
    return res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = changeStatus;
