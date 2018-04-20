'use strict';

const { pick } = require('lodash');

const safeUser = user => pick(user, ['sub', 'given_name', 'family_name', 'email', 'id', 'status', 'legacy_username']);


module.exports = safeUser;
