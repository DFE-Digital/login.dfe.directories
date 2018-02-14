'use strict';

const { generate, DEC_CHARSET } = require('./../../../utils');

const generateInvitationCode = () => generate(8, DEC_CHARSET);

module.exports = {
  generateInvitationCode,
};
