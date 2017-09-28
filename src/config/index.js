module.exports = {
  hostingEnvironment: {
    env: process.env.NODE_ENV ? process.env.NODE_ENV : 'dev',
    host: process.env.HOST ? process.env.HOST : 'localhost',
    port: process.env.PORT ? process.env.PORT : 4433,
    protocol: (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') == 'dev' ? 'https' : 'http'
  },
  secret : process.env.JWT_SECRET,
  redisurl : process.env.REDIS_CONNECTION_URL,
  mongoConnection : process.env.MONGO_CONNECTION_URL,
  ldapConfiguration :{
    url: process.env.LDAP_URL,
    baseDN: process.env.LDAP_BASE_DN,
    username: process.env.LDAP_USERNAME,
    password: process.env.LDAP_PASSWORD },
  RequestVerificationCertification: process.env.REQUEST_VERIFICATION_CERT_LOCATION
};