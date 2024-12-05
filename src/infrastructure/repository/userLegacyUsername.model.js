const { Sequelize } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
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
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define("user_legacy_username", attributes, options);
}
