const { Sequelize } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      primaryKey: true,
      type: Sequelize.UUID,
      allowNull: false,
    },
    old_status: {
      type: "VARCHAR(5000)",
      allowNull: false,
    },
    new_status: {
      type: "VARCHAR(5000)",
      allowNull: false,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define("user_status_change_reasons", attributes, options);
}
