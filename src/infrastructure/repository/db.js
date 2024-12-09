const { Sequelize } = require("sequelize");
const assert = require("assert");

const config = require("../config");

const db = {};

async function initialize() {
  const databaseName = config.adapter.params.name || "mssql";
  const packetSize = config.adapter.params.packetSize || 32768;

  assert(
    config.adapter.params.username,
    "Database property username must be supplied",
  );
  assert(
    config.adapter.params.password,
    "Database property password must be supplied",
  );
  assert(config.adapter.params.host, "Database property host must be supplied");
  assert(
    config.adapter.params.dialect,
    "Database property dialect must be supplied, this must be postgres or mssql",
  );

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
      name: "query",
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000,
      max: 5,
    },
    host: config.adapter.params.host,
    dialect: config.adapter.params.dialect,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      options: {
        encrypt: true,
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
  // connect to db
  const sequelize = new Sequelize(
    databaseName,
    config.adapter.params.username,
    config.adapter.params.password,
    dbOpts,
  );

  // init models and add them to the exported db object
  db.user = require("./user.model")(sequelize);
  db.userCode = require("./userCode.model")(sequelize);
  db.userPasswordPolicy = require("./userPasswordPolicy.model")(sequelize);
  db.userLegacyUsername = require("./userLegacyUsername.model")(sequelize);
  db.passwordHistory = require("./passwordHistory.model")(sequelize);
  db.userPasswordHistory = require("./userPasswordHistory.model")(sequelize);
  db.invitation = require("./invitation.model")(sequelize);
  db.invitationCallback = require("./invitationCallback.model")(sequelize);
  // define associations
  db.userPasswordPolicy.belongsTo(db.user, {
    foreignKey: "uid",
    sourceKey: "sub",
    as: "user",
  });
  db.user.hasMany(db.userLegacyUsername, {
    foreignKey: "uid",
    sourceKey: "sub",
  });
  db.user.belongsToMany(db.passwordHistory, {
    through: db.userPasswordHistory,
  });
  db.passwordHistory.belongsToMany(db.user, {
    through: db.userPasswordHistory,
  });
  db.invitation.hasMany(db.invitationCallback, {
    foreignKey: "invitationId",
    sourceKey: "id",
    as: "callbacks",
  });

  // sync all models with database
  await sequelize.sync({ alter: false, force: false });
}

initialize();
module.exports = db;
