'use strict';
const logger = require('./../../../infrastructure/logger');
const redisUserCodeStorage = require('./../data/redisUserCodeStorage');

const validate = async (req,res) => {
  try{
    if(!req.params.uid || !req.params.code) {
      res.status(400).send();
      return;
    }
    const uid = req.params.uid;
    const storage = new redisUserCodeStorage();

    var code = await storage.getUserPasswordResetCode(uid);

    if(code === null || code === undefined){
      res.status(404).send();
      return;
    }

    if(code.code === req.params.code) {
      res.status(200).send(code);
      return;
    }
    res.status(404).send();

  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }


};

module.exports = validate;