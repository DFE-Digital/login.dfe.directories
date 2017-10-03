'use strict';

const express = require('express');
const UserAdapter = require('../user');
const config = require('./../config')
const apiAuth = require('login.dfe.api.auth');

const router = express.Router();

const routeExport = () => {

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
      res.send(result);
    }
    catch(e){
      res.status(500).send(e);
    }
  });

  return router;
};

module.exports = routeExport;