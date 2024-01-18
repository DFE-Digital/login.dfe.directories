const Sequelize = require('sequelize');

const { Op } = Sequelize;
const assert = require('assert');
const config = require('../config');
const db = require('./db');

const dbSchema = config.adapter.params.schema || 'directories';

module.exports = {
  db,
};