'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const UserAdapter = require('../user');
const config = require('./../config')

const router = express.Router();

const routeExport = (secret) => {

  router.use((req, res, next) => {
    function getFailureMessage() {
      return {
        success: false,
        message: 'No token provided.'
      };
    }
    // check header or url parameters or post parameters for token
    if (req.headers.authorization === undefined || req.headers.authorization.split(' ').length !== 2) {
      return res.status(403).send(getFailureMessage());
    }
    let token = req.headers.authorization.split(' ')[1];

    if (token) {
      jwt.verify(token, secret, function (err, decoded) {
        if (err) {
          return res.json({success: false, message: 'Failed to authenticate token.'});
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.status(403).send(getFailureMessage());
    }
  });

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