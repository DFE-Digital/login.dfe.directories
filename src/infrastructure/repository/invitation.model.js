const { Sequelize } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
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
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define("invitation", attributes, options);
}
