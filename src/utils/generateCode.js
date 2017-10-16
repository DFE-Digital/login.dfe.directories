'use strict';

const DEC_CHARSSET = 'ABCDEFHJKLMNPRSTUV';
const FULL_CHARSET = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789-.><!@%&*+_';

const generate = (length = 8, charset = DEC_CHARSSET) => {
  let secret = '';
  for(let i = 0; i < length; i++) {
    secret += charset[Math.floor(Math.random() * charset.length)];
  }
  return secret;
};

module.exports = {
  DEC_CHARSSET,
  FULL_CHARSET,
  generate
};
