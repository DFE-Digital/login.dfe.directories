const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const {
  getUserServicesRaw,
  getUserOrganisationsRaw,
} = require("login.dfe.api-client/users");
const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");
const { safeUser } = require("../../../utils");
const config = require("../../../infrastructure/config");

// The organisations API filters by user.status, so we capture the snapshot
// AFTER activation (when the user is visible again) and ship it inside the
// notification — keeps downstream jobs from doing a live lookup.
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
      `Failed to capture user access snapshot for ${userId} after activation: ${e.message}`,
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
    `Send user updated notification for ${user.sub} with job id ${jobId} (reason: activate)`,
    { correlationId },
  );
};

const changeStatus = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send();
    }

    const correlationId = req.header("x-correlation-id");
    const user = await userAdapter.changeStatus(
      req.params.id,
      1,
      correlationId,
    );
    if (!user) {
      return res.status(404).send();
    }

    const accessSnapshot = await captureUserAccessSnapshot(
      req.params.id,
      correlationId,
    );

    await sendNotification(user, accessSnapshot, correlationId);
    return res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = changeStatus;
