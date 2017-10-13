'use strict';
const logger = require('../logger');
const redisUserCodeStorage = require('./redisUserCodeStorage');

const post = async (req,res) => {

  try{
    if(req.body.uid === null || req.body.uid === undefined || req.body.uid === '') {
      res.status(400).send();
      return;
    }
    const uid = req.body.uid;
    const storage = new redisUserCodeStorage();

    const code = await storage.getUserPasswordResetCode(uid);

    if(code === null || code === undefined){
      storage.createUserPasswordResetCode(uid).then((codeResult)=>{
        storage.close();
        res.send(codeResult);
        return;
      });

    }else{
      res.send(code);
    }
  }catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;
