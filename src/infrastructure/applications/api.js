const config = require('./../config');

const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const getServiceById = async (id) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await rp({
      method: 'GET',
      uri: `${config.applications.service.url}/services/${id}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  getServiceById,
};
