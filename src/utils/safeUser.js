'use strict';

const { pick } = require('lodash');

const safeUser = user => pick(user, ['sub', 'given_name', 'family_name', 'email', 'job_title', 'id', 'status', 'legacy_username', 'phone_number', 'last_login', 'isMigrated', 'password_reset_required']);

module.exports = safeUser;
