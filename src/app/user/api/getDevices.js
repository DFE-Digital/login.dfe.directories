const { getUserDevices } = require('./../devices');
const logger = require('./../../../infrastructure/logger');

const action = async (req, res) => {
  try {
    let devices = await getUserDevices(req.params.id.toLowerCase(), req.header('x-correlation-id'));
    if (!devices) {
      devices = [];
    }
    res.contentType('json').send(JSON.stringify(devices.map(ud => Object.assign({}, ud, { userId: undefined }))));
  } catch (e) {
    logger.error(e);
    res.status(500).send();
  }
};

module.exports = action;
