"use strict";

const { generate, DEC_CHARSET } = require("./../../../utils");

module.exports = () => generate(8, DEC_CHARSET);

// The generate function calls the geneerateCode.js to get random set using the new crypto function
