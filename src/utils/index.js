const generate = require('./generateCode');

module.exports = {
  DEC_CHARSET: generate.DEC_CHARSET,
  FULL_CHARSET: generate.FULL_CHARSET,
  generate: generate.generate
};