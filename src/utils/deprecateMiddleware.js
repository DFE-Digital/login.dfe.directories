"use strict";

const logger = require("./../infrastructure/logger");

const handler = (alternate) => (req, res, next) => {
  let clientId = null;
  if (req.authInfo) {
    clientId = req.authInfo.sub;
  }
  res.set(
    "X-API-DEPRECATION",
    `This API is deprecated and will be removed soon - see ${alternate}`,
  );
  let errorMessage = `DEPRECATED API CALLED : ${req.url}`;
  if (clientId) {
    errorMessage = `${errorMessage} NOTE : Calling client id from JWT is ${clientId}`;
  }
  logger.error(errorMessage);
  next();
};

module.exports = handler;
