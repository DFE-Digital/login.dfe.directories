const { Sequelize } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
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
      defaultValue: Sequelize.SMALLINT,
    },
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define("user_password_policy", attributes, options);
}
