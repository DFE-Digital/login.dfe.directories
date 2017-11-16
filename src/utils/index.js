const generate = require('./generateCode');
const deprecateWith = require('./deprecateMiddleware');
const safeUser = require('./safeUser');

module.exports = {
  DEC_CHARSET: generate.DEC_CHARSET,
  FULL_CHARSET: generate.FULL_CHARSET,
  generate: generate.generate,
  deprecateWith,
  safeUser,
};