'use strict';

const {generate, DEC_CHARSET} = require('./../utils/');

module.exports = () => {
  return generate(8, DEC_CHARSET);
};
