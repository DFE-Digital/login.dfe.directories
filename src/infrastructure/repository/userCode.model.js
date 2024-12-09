const { Sequelize } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
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
      type: "VARCHAR(5000)",
      allowNull: true,
    },
    email: {
      type: "VARCHAR(255)",
      allowNull: true,
    },
    codeType: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define("user_code", attributes, options);
}
