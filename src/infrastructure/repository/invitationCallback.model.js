const { Sequelize } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    invitationId: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    sourceId: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
    callbackUrl: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    },
    clientId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
  };

  return sequelize.define('invitation_callback', attributes, options);
}
