'use strict';

const crypto = require('crypto');

const NUMERIC_CHARSET = '123456789';
const DEC_CHARSET = '46789BCDFGHJKLMNPRSTVWXY';
const FULL_CHARSET = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789-.><!@%&*+_';

const getRandom = () => {
  const value = crypto.randomBytes(4).readUInt32LE() / 0x100000000;
  return value;
};

const generate = (length = 8, charset = DEC_CHARSET) => {
  let secret = '';
  for (let i = 0; i < length; i += 1) {
    secret += charset[Math.floor(getRandom() * charset.length)];
  }
  return secret;
};

module.exports = {
  NUMERIC_CHARSET,
  DEC_CHARSET,
  FULL_CHARSET,
  generate,
};
