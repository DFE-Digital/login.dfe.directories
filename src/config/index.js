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
  RequestVerificationCertification: process.env.REQUEST_VERIFICATION_CERT_LOCATION,
  adapters:
    [{
      id: '8850a16c-4258-4d69-86b7-95b69cd5cd15',
      type: 'file'
    },{
      id: 'ff080eff-b525-4215-a11f-f5b37eefad45',
      type: 'mongo'
    },{
      id: '9af9f8a2-ceec-461f-8db4-ff37073903df',
      type: 'redis'
    },{
      id: '76841484-ba65-4195-ab73-9571cae5d4ca',
      type: 'azuread'
    }]

};