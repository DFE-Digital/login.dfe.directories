'use strict';

const { generate, NUMERIC_CHARSET } = require('./../../../utils');

module.exports = () => generate(6, NUMERIC_CHARSET);
