'use strict';

const {pick} = require('lodash');

const safeUser = user => pick(user, ['sub', 'given_name', 'family_name', 'email']);

module.exports = safeUser;
