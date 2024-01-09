const userAdapter = require('./../adapter');
const logger = require('./../../../infrastructure/logger');
const { safeUser, extractValueFromQueryString } = require('./../../../utils');

const searchV2 = async (req, res) => {
  try {
    const ids = req.body.ids.split(',');
    const status = extractValueFromQueryString.extractParam(req,'status');
    const from = extractValueFromQueryString.extractParam(req, 'from');
    const to = extractValueFromQueryString.extractParam(req, 'to');

    if (status && status !== '1' && status !== '0') {
      return res.status(400).send('status should be either 0 or 1');
    }

    if (to && isNaN(Date.parse(to))) {
      return res.status(400).send('to date is not a valid date');
    }
    if (from && isNaN(Date.parse(from))) {
      return res.status(400).send('from date is not a valid date');
    }

    const users = await userAdapter.getUsers(ids, status, from, to, req.header('x-correlation-id'));

    if (!users) {
      return res.status(404).send();
    }
    return res.send(users.map(user => safeUser(user)));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};


module.exports = searchV2;
