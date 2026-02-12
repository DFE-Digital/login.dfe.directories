const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");
const { safeUser } = require("../../../utils");
const config = require("../../../infrastructure/config");

const sendNotification = async (user, correlationId) => {
    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    const jobId = await serviceNotificationsClient.notifyUserUpdated(
      safeUser(user),
    );
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
    await sendNotification(user, correlationId);
    return res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = changeStatus;
