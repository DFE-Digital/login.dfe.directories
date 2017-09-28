'use strict';

class UserAdapter {
  async find(id) {
    return Promise.resolve({});
  }
  async authenticate(email, password, sig) {
    return Promise.resolve({});
  }
}

module.exports = UserAdapter;