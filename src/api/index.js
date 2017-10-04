'use strict';

const express = require('express');
const UserAdapter = require('../user');
const apiAuth = require('login.dfe.api.auth');

const router = express.Router();
let config;
const routeExport = (configuration) => {

  config = configuration;
  router.use(apiAuth(router,config));

  router.get('/:directoryId/user/:id', async function (req, res) {
    const userAdapter = UserAdapter(config, req.params.directoryId);
    try{
      const user = await userAdapter.find(req.params.id);
      res.send(user);
    }catch(e){
      res.status(500).send(e);
    }
  });

  router.post('/:directoryId/user/authenticate', async function(req,res){
    const userAdapter = UserAdapter(config, req.params.directoryId);
    try{
      const result = await userAdapter.authenticate(req.body.username, req.body.password, req.body.sig)

      if(result){
        res.send(req.body.username);
      }else {
        res.status(401);
      }
    }
    catch(e){
      res.status(500).send(e);
    }
  });

  return router;
};

module.exports = routeExport;