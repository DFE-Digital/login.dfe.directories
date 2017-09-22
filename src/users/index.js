const config = require('./../config');

module.exports =  config.redisurl !== undefined ? require('../users/UsersRedisAdapter'): require('../users/UsersFileAdapter');