const config = require('./../../../infrastructure/config');

let adapter;
if (config.devices.type === 'redis') {
  adapter = require('./redis');
} else if (config.devices.type === 'azureblob') {
  adapter = require('./azureBlob');
} else {
  adapter = require('./static');
}
module.exports = adapter;
