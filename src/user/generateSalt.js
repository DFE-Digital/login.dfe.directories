'use strict';

const {generate, FULL_CHARSET} = require('./../utils/');

module.exports = () => {
  return generate(25, FULL_CHARSET);
};
