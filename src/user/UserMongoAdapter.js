'use strict';

const UserAdapter = require('./UserAdapter');
const mongoose = require('mongoose');
let config;


const schema = new mongoose.Schema({
  id: String,
  first_name: String,
  last_name: String
});

class UserMongoAdapter extends UserAdapter{
  constructor(configuration){
    super();
    config = configuration;
  }
  find(email) {
    return new Promise((resolve, reject) => {
      mongoose.connect(config.mongoConnection, { useMongoClient: true}).then(() =>{
        const usersModel = mongoose.model('User', schema, 'Users');
        usersModel.find({email : email}).then((user) =>{
          resolve(user);
        });
      });
    });
  }
}

module.exports = UserMongoAdapter;