const config = require('./../config');

module.exports = config.mongoConnection !== undefined
                  ? require('../users/UserMongoAdapter')
                  : config.redisurl !== undefined
                      ? require('../users/UsersRedisAdapter')
                      : require('../users/UsersFileAdapter');