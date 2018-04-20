'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const assert = require('assert');
const config = require('./../config');

const getIntValueOrDefault = (value, defaultValue = 0) => {
  if (!value) {
    return defaultValue;
  }
  const int = parseInt(value);
  return isNaN(int) ? defaultValue : int;
};

const databaseName = config.adapter.params.name || 'postgres';
const encryptDb = config.adapter.params.encrypt || false;
const dbSchema = config.adapter.params.schema || 'directories';

let db;

if (config.adapter.params && config.adapter.params.postgresUrl) {
  db = new Sequelize(config.database.postgresUrl);
} else {
  assert(config.adapter.params.username, 'Database property username must be supplied');
  assert(config.adapter.params.password, 'Database property password must be supplied');
  assert(config.adapter.params.host, 'Database property host must be supplied');
  assert(config.adapter.params.dialect, 'Database property dialect must be supplied, this must be postgres or mssql');

  const dbOpts = {
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
      name: 'query',
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000,
      max: 5,
    },
    host: config.adapter.params.host,
    operatorsAliases: Op,
    dialect: config.adapter.params.dialect,
    dialectOptions: {
      encrypt: encryptDb,
    },
  };
  if (config.adapter.params.pool) {
    dbOpts.pool = {
      max: getIntValueOrDefault(config.adapter.params.pool.max, 5),
      min: getIntValueOrDefault(config.adapter.params.pool.min, 0),
      acquire: getIntValueOrDefault(config.adapter.params.pool.acquire, 10000),
      idle: getIntValueOrDefault(config.adapter.params.pool.idle, 10000),
    };
  }
  db = new Sequelize(databaseName, config.adapter.params.username, config.adapter.params.password, dbOpts);
}

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
  legacy_username: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'user',
  schema: dbSchema,
});

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

module.exports = {
  user,
  userCode,
};
