'use strict';

const Sequelize = require('sequelize');

const { Op } = Sequelize;
const assert = require('assert');
const config = require('../config');
const db = require('./db');
const dbSchema = config.adapter.params.schema || 'directories';

/*
const user = db.define('user', {
  sub: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  given_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  job_title: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  family_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING(5000),
    allowNull: false,
  },
  salt: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0,
  },
  phone_number: {
    type: Sequelize.STRING,
  },
  last_login: {
    type: Sequelize.STRING,
  },
  prev_login: {
    type: Sequelize.STRING,
  },
  isMigrated: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  password_reset_required: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'user',
  schema: dbSchema,
});

const passwordHistory = db.define('password_history', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING(5000),
    allowNull: false,
  },
  salt: {
    type: Sequelize.STRING,
    allowNull: false,
  },

}, {
  timestamps: true,
  tableName: 'password_history',
  schema: dbSchema,
});


const userPasswordHistory = db.define('user_password_history',{
  passwordHistoryId: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  userSub: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'user_password_history',
  schema: dbSchema,
});
user.belongsToMany(passwordHistory, { through: userPasswordHistory });
passwordHistory.belongsToMany(user, { through: userPasswordHistory });

const userCode = db.define('user_code', {
  uid: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  clientId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  redirectUri: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  contextData: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  codeType: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'user_code',
  schema: dbSchema,
});

const userLegacyUsername = db.define('user_legacy_username', {
  uid: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  legacy_username: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'user_legacy_username',
  schema: dbSchema,
});
user.hasMany(userLegacyUsername, { foreignKey: 'uid', sourceKey: 'sub' });

const userDevice = db.define('user_device', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  uid: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  deviceType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  serialNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'user_device',
  schema: dbSchema,
});
user.hasMany(userDevice, { foreignKey: 'uid', sourceKey: 'sub' });
userDevice.belongsTo(user, { foreignKey: 'uid', sourceKey: 'sub', as: 'user' });

const invitationCallback = db.define('invitation_callback', {
  invitationId: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  sourceId: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  callbackUrl: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: '',
  },
  clientId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'invitation_callback',
  schema: dbSchema,
});

const invitationDevice = db.define('invitation_device', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  invitationId: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  deviceType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  serialNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'invitation_device',
  schema: dbSchema,
});

const invitation = db.define('invitation', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  originClientId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  originRedirectUri: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  selfStarted: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  overrideSubject: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  overrideBody: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  previousUsername: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  previousPassword: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  previousSalt: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  deactivated: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  reason: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  completed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  uid: {
    type: Sequelize.UUID,
    allowNull: true,
  },
  isMigrated: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  approverEmail: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  orgName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  codeMetaData: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  isApprover: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'invitation',
  schema: dbSchema,
});
invitation.hasMany(invitationDevice, { foreignKey: 'invitationId', sourceKey: 'id', as: 'devices' });
invitation.hasMany(invitationCallback, { foreignKey: 'invitationId', sourceKey: 'id', as: 'callbacks' });
invitationDevice.belongsTo(invitation, { as: 'invitation' });

const userPasswordPolicy = db.define('user_password_policy', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
  },
  uid: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  policyCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password_history_limit: {
    type: Sequelize.SMALLINT,
    defaultValue: 3,
  }
}, {
  timestamps: true,
  tableName: 'user_password_policy',
  schema: dbSchema,
});
user.hasMany(userPasswordPolicy, { foreignKey: 'uid', sourceKey: 'sub', as: 'userPasswordPolicy' });
userPasswordPolicy.belongsTo(user, { foreignKey: 'uid', sourceKey: 'sub', as: 'user' });

module.exports = {
  user,
  userCode,
  userLegacyUsername,
  userDevice,
  invitation,
  invitationDevice,
  invitationCallback,
  passwordHistory,
  userPasswordHistory,
  userPasswordPolicy,
};
*/