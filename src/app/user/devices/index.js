const config = require('./../../../infrastructure/config');
let adapter;
if (config.devices.type === 'redis') {
  adapter = require('./redis');
} else {
  adapter = require('./static');
}
module.exports = adapter;