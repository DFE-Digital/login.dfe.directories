'use strict';

class UserAdapter {
  async find(id) {
    return Promise.resolve({});
  }
}

module.exports = UserAdapter;