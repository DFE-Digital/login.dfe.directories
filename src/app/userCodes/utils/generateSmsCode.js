'use strict';

const { generate, NUMERIC_CHARSET } = require('./../../../utils');

module.exports = () => generate(6, NUMERIC_CHARSET);

// The generate function calls the geneerateCode.js to get random set using the new crypto function
/*
* const getRandom = () => {
* const value = crypto.randomBytes(4).readUInt32LE() / 0x100000000;
* return value;
* };
 */
