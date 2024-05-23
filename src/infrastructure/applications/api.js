const config = require('./../config');

const { fetchApi } = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const getServiceById = async (id) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await fetchApi(`${config.applications.service.url}/services/${id}`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
      }
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
