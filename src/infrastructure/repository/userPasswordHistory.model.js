const { Sequelize } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
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
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define("user_password_history", attributes, options);
}
