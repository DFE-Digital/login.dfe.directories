const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");

const authenticate = async (req, res) => {
  try {
    const requestUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    logger.info(
      `client host: ${req.headers.referer} request url: ${requestUrl}`,
    );

    const result = await userAdapter.authenticate(
      req.body.username,
      req.body.password,
      req.header("x-correlation-id"),
    );

    if (!result) {
      return res.status(403).contentType("json").send({
        reason_code: "INVALID_CREDENTIALS",
        reason_description: "Invalid username or password",
      });
    }

    if (!result.passwordValid) {
      return res.status(403).contentType("json").send({
        reason_code: "INVALID_CREDENTIALS",
        reason_subcode: "PASSWORD",
        reason_description: "Invalid username or password",
      });
    }

    if (result.user.status === 0) {
      return res.status(403).contentType("json").send({
        reason_code: "ACCOUNT_DEACTIVATED",
        reason_description: "Account has been deactivated",
      });
    }

    return res.send(result.user);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = authenticate;
