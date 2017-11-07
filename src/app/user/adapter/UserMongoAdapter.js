'use strict';

const UserAdapter = require('./UserAdapter');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  sub: String,
  given_name: String,
  family_name: String,
  email: String
});

class UserMongoAdapter extends UserAdapter{
  constructor(configuration){
    super();
    this.config = configuration;
  }
  find(id) {
    return new Promise((resolve, reject) => {
      mongoose.connect(this.config.mongoConnection, { useMongoClient: true}).then(() =>{
        const usersModel = mongoose.model('User', schema, 'Users');
        usersModel.find({sub : id}).then((user) =>{
          resolve(user);
        });
      });
    });
  }
  async list(page = 1, pageSize = 10) {
    return Promise.resolve([]);
  }
}

module.exports = UserMongoAdapter;