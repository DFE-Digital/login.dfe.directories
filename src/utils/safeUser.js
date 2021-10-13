'use strict';

const { pick } = require('lodash');

const safeUser = user => pick(user, ['sub', 'given_name', 'family_name', 'email', 'job_title', 'id', 'status', 'legacy_username', 'phone_number', 'isMigrated']);


module.exports = safeUser;
