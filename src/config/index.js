module.exports = {
  hostingEnvironment: {
    env: process.env.NODE_ENV ? process.env.NODE_ENV : 'dev',
    host: process.env.HOST ? process.env.HOST : 'localhost',
    port: process.env.PORT ? process.env.PORT : 4433,
    protocol: (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') == 'dev' ? 'https' : 'http'
  },
  secret : process.env.JWT_SECRET
};