'use strict';

module.exports = (length = 8) => {
  const charset = 'ABCDEFHJKLMNPRSTUV';
  let secret = '';
  for(let i = 0; i < length; i++) {
    secret += charset[Math.floor(Math.random() * charset.length)];
  }
  return secret;
};
