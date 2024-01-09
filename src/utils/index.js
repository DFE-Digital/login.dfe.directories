const generate = require('./generateCode');
const deprecateWith = require('./deprecateMiddleware');
const safeUser = require('./safeUser');
const extractValueFromQueryString = require('./extractValueFromQueryString');


module.exports = {
  NUMERIC_CHARSET: generate.NUMERIC_CHARSET,
  DEC_CHARSET: generate.DEC_CHARSET,
  FULL_CHARSET: generate.FULL_CHARSET,
  generate: generate.generate,
  deprecateWith,
  safeUser,
  extractValueFromQueryString
};
