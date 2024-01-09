const { Sequelize } = require('sequelize');

module.exports = model;

function model(sequelize) {
  const attributes = {
    sub: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    given_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    job_title: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    family_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: 'VARCHAR(5000)',
      allowNull: false,
    },
    salt: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: Sequelize.SMALLINT,
    },
    phone_number: {
      type: Sequelize.STRING,
    },
    last_login: {
      type: Sequelize.DATE,
    },
    prev_login: {
      type: Sequelize.DATE,
    },
    isMigrated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: Sequelize.BOOLEAN,
    },
    password_reset_required: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: Sequelize.BOOLEAN,
    },
  };

  const options = {
    freezeTableName: true,
    timestamps: true,
    defaultScope: {
      // exclude password hash by default
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      // include hash with this scope
      withHash: { attributes: {} },
    },
  };

  return sequelize.define('user', attributes, options);
}
