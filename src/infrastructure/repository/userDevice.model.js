const { Sequelize } = require('sequelize');

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
    deviceType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    serialNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define('user_device', attributes, options);
}
