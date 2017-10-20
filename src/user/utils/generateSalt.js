'use strict';

const {generate, FULL_CHARSET} = require('../../utils/index');

module.exports = () => {
  return generate(25, FULL_CHARSET);
};
