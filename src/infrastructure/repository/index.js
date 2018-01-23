'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const assert = require('assert');
const config = require('./../config');

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
  db = new Sequelize(databaseName, config.adapter.params.username, config.adapter.params.password, {
    host: config.adapter.params.host,
    dialect: config.adapter.params.dialect,
    dialectOptions: {
      encrypt: encryptDb,
    },
  });
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
}, {
  timestamps: true,
  tableName: 'user',
  schema: dbSchema,
});

module.exports = {
  user,
};
