const config = require('./../config');

module.exports = config.mongoConnection !== undefined
                  ? require('./UserMongoAdapter')
                  : config.redisurl !== undefined
                      ? require('./UserRedisAdapter')
                      : require('./UserFileAdapter');