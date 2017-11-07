'use strict';

const express = require('express');
const router = express.Router();

const config = require('./../../infrastructure/config')();
const UsersAdapter = require('./../user/adapter');

const routes = () => {
  router.get('/', async (req, res) => {
    let page = 1;
    if (req.query.page && parseInt(req.query.page, 10) !== NaN) {
      page = parseInt(req.query.page, 10);
    }
    const usersAdapter = UsersAdapter(config);
    const pageOfUsers = await usersAdapter.list(page);
    const users = await Promise.all(pageOfUsers.users.map(async (user) => {
      const codes = [];
      return {
        id: user.sub,
        name: `${user.given_name} ${user.family_name.toUpperCase()}`,
        email: user.email,
        numCodes: codes.length,
      };
    }));
    res.render('dev/views/launch', {
      users,
      numberOfPages: pageOfUsers.numberOfPages,
      currentPage: page,
    });
  });

  router.get('/user/:userid', async (req, res) => {
    const usersAdapter = UsersAdapter(config);
    const user = await usersAdapter.find(req.params.userid);
    if (!user) {
      res.status(404).send();
      return;
    }

    const codes = [
      'ABC123',
      '098XYZ',
    ];

    res.render('dev/views/user', {
      user,
      codes,
    });
  });

  return router;
};

module.exports = routes();