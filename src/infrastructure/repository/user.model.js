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
      type: 'VARCHAR(255)',
      allowNull: false,
    },
    given_name: {
      type: 'VARCHAR(255)',
      allowNull: false,
    },
    job_title: {
      type: 'VARCHAR(255)',
      allowNull: true,
    },
    family_name: {
      type: 'VARCHAR(255)',
      allowNull: false,
    },
    password: {
      type: 'VARCHAR(5000)',
      allowNull: false,
    },
    salt: {
      type: 'VARCHAR(255)',
      allowNull: false,
    },
    status: {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: Sequelize.SMALLINT,
    },
    phone_number: {
      type: 'VARCHAR(50)',
    },
    last_login: {
      type: 'DateTime',
    },
    prev_login: {
      type: 'DateTime',
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
    is_entra: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: Sequelize.BOOLEAN,
    },
    entra_oid: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    entra_linked: {
      type: 'DateTime',
      allowNull: true,
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
