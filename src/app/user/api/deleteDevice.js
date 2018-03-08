const { deleteUserDevice } = require('./../devices');
const logger = require('./../../../infrastructure/logger');
const uuid = require('uuid/v4');

const validateRequest = (req) => {
  if (!req.body.type) {
    return 'Must provide type';
  }

  if (req.body.type !== 'digipass') {
    return `Invalid type ${req.body.type}. Valid options are digipass`;
  }

  if (!req.body.serialNumber) {
    return 'Must provide serialNumber';
  }

  return undefined;
};

const action = async (req, res) => {
  const validationFailureMessage = validateRequest(req);
  if (validationFailureMessage) {
    return res.status(400).contentType('json').send(JSON.stringify({
      message: validationFailureMessage,
    }));
  }

  try {
    const id = uuid();
    await deleteUserDevice(req.params.id, {
      id,
      type: req.body.type,
      serialNumber: req.body.serialNumber,
    }, req.header('x-correlation-id'));

    return res.status(202).send();
  } catch (e) {
    logger.error(e);
    return res.status(500).send();
  }
};

module.exports = action;
