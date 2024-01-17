const { Sequelize } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    invitationId: {
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

  return sequelize.define('invitation_device', attributes, options);
}
