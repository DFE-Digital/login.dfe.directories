const tedious = require("tedious");
const { Sequelize } = require("sequelize");
const assert = require("assert");

const config = require("../config");

const { Op } = Sequelize;

module.exports = db = {};

initialize();

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
  // db = new Sequelize(databaseName, config.adapter.params.username, config.adapter.params.password, dbOpts);
  // connect to db
  const sequelize = new Sequelize(
    databaseName,
    config.adapter.params.username,
    config.adapter.params.password,
    dbOpts,
  );

  // init models and add them to the exported db object
  this.db.user = require("./user.model")(sequelize);
  this.db.userCode = require("./userCode.model")(sequelize);
  this.db.userPasswordPolicy = require("./userPasswordPolicy.model")(sequelize);
  this.db.userLegacyUsername = require("./userLegacyUsername.model")(sequelize);
  this.db.passwordHistory = require("./passwordHistory.model")(sequelize);
  this.db.userPasswordHistory = require("./userPasswordHistory.model")(
    sequelize,
  );
  this.db.invitation = require("./invitation.model")(sequelize);
  this.db.invitationCallback = require("./invitationCallback.model")(sequelize);
  // define associations?
  // db.user.belongsTo(db.userPasswordPolicy, { sourceKey: 'sub' });
  this.db.userPasswordPolicy.belongsTo(this.db.user, {
    foreignKey: "uid",
    sourceKey: "sub",
    as: "user",
  });
  this.db.user.hasMany(this.db.userLegacyUsername, {
    foreignKey: "uid",
    sourceKey: "sub",
  });
  this.db.user.belongsToMany(this.db.passwordHistory, {
    through: this.db.userPasswordHistory,
  });
  this.db.passwordHistory.belongsToMany(this.db.user, {
    through: this.db.userPasswordHistory,
  });
  this.db.invitation.hasMany(this.db.invitationCallback, {
    foreignKey: "invitationId",
    sourceKey: "id",
    as: "callbacks",
  });

  // sync all models with database
  await sequelize.sync({ alter: false, force: false });
}
