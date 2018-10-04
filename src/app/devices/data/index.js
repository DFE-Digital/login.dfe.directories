const config = require('./../../../infrastructure/config');

let adapter;
if (config.devices.type === 'redis') {
  adapter = require('./redis');
} else if (config.devices.type === 'azureblob') {
  adapter = require('./azureBlob');
} else if (config.devices.type === 'sequelize') {
  adapter = require('./sequelize');
} else {
  adapter = require('./static');
}
module.exports = adapter;
