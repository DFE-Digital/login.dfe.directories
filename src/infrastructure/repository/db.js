const tedious = require('tedious');
const { Sequelize } = require('sequelize');
const assert = require('assert');

const config = require('../config');

const { Op } = Sequelize;

module.exports = db = {};

initialize();

const getIntValueOrDefault = (value, defaultValue = 0) => {
  if (!value) {
    return defaultValue;
  }
  const int = parseInt(value);
  return isNaN(int) ? defaultValue : int;
};

async function initialize() {
  const databaseName = config.adapter.params.name || 'mssql';
  const encryptDb = config.adapter.params.encrypt || false;
  const dbSchema = config.adapter.params.schema || 'directories';
  const packetSize = config.adapter.params.packetSize || 32768;

  assert(config.adapter.params.username, 'Database property username must be supplied');
  assert(config.adapter.params.password, 'Database property password must be supplied');
  assert(config.adapter.params.host, 'Database property host must be supplied');
  assert(config.adapter.params.dialect, 'Database property dialect must be supplied, this must be postgres or mssql');

  // create db if it doesn't already exist
  //await ensureDbExists(databaseName);

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
      options: {
        encrypt: encryptDb,
        packetSize,
      },
    },
  };
  if (config.adapter.params.pool) {
    dbOpts.pool = {
      max: config.adapter.params.pool.max,
      min: config.adapter.params.pool.min,
      acquire: config.adapter.params.pool.acquire,
      idle: config.adapter.params.pool.idle,
    };
  }
  // db = new Sequelize(databaseName, config.adapter.params.username, config.adapter.params.password, dbOpts);
  // connect to db
  const sequelize = new Sequelize(databaseName, config.adapter.params.username, config.adapter.params.password, dbOpts);

  // init models and add them to the exported db object
  db.user = require('./user.model')(sequelize);
  db.userCode = require('./userCode.model')(sequelize);
  db.userPasswordPolicy = require('./userPasswordPolicy.model')(sequelize);

  // define associations?
  db.user.hasMany(db.userPasswordPolicy, { foreignKey: 'uid', sourceKey: 'sub', as: 'userPasswordPolicy' });
  db.userPasswordPolicy.belongsTo(db.user, { foreignKey: 'uid', sourceKey: 'sub', as: 'user' });
  // sync all models with database
  await sequelize.sync({ alter: false });
}

async function ensureDbExists(dbName) {
  return new Promise((resolve, reject) => {
    const dbConfig = {
      server: config.adapter.params.host,
      databaseName: dbName,
      options: {
        port: 1433,
        trustServerCertificate: true,
      },
      authentication: {
        type: 'default',
        options: {
          userName: config.adapter.params.username,
          password: config.adapter.params.password,
        },
      },
    };
    const connection = new tedious.Connection(dbConfig);
    connection.connect((err) => {
      if (err) {
        console.error(err);
        reject(`Connection Failed: ${err.message}`);
      } else {
        resolve(true);
      }
    });
  });
}
