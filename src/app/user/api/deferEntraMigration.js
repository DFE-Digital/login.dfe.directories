const userAdapter = require("../adapter");
const { isUuid, isValidDate } = require("./helpers");

/**
 * POST body with {"deferExpiryDate" : "YYYY-MM-DDTHH:mm:ss.sssZ"}
 * deferExpiryDate is a string in ISO 8601 format
 */

const deferEntraMigration = async (req, res) => {
  const correlationId = req.header("x-correlation-id");
  const { uid } = req.params;
  const { deferExpiryDate } = req.body;

  if (!isUuid(uid)) {
    return res.status(400).send("The uid provided is not a valid UUID.");
  }

  if (!deferExpiryDate) {
    return res
      .status(400)
      .send("The 'deferExpiryDate' field is required in the request body.");
  }

  if (!isValidDate(deferExpiryDate)) {
    return res
      .status(400)
      .send(
        "Invalid date format: Expected ISO 8601 ('YYYY-MM-DDTHH:mm:ss.sssZ').",
      );
  }
  if (Date.parse(deferExpiryDate) <= Date.now()) {
    return res
      .status(400)
      .send("Invalid date: the 'deferExpiryDate' must be a future date.");
  }

  try {
    await userAdapter.updateEntraDeferUntilDate(
      uid,
      deferExpiryDate,
      correlationId,
    );
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

module.exports = deferEntraMigration;
