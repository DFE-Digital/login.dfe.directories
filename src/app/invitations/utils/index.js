'use strict';

const { generate, DEC_CHARSET, FULL_CHARSET } = require('./../../../utils');

const generateInvitationCode = () => generate(8, DEC_CHARSET);
const generateEntraIdOtp = () => generate(14, FULL_CHARSET);

module.exports = {
  generateInvitationCode,
  generateEntraIdOtp,
};
