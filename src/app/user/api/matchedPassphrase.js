const userAdapter = require('../adapter');
const logger = require('../../../infrastructure/logger');

const matchedPassphrase = async (req, res) => {
  try {
    if(req.body.newPass === undefined || req.body.newPass === '')
    {
        return res.status(404).send();
    }
    const results = await userAdapter.isMatched(req.params.uid, req.body.newPass, req.header('x-correlation-id'));
   
    return res.send(results);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = matchedPassphrase;
