const { fetchApi } = require('login.dfe.async-retry');

async function callGraphApi(endpoint, method, accessToken, body = null) {
  try {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    if (['POST', 'PATCH', 'PUT'].includes(method) && body) {
      options.body = body;
    }

    const result = await fetchApi(endpoint, options);

    return result;
  } catch (e) {
    return {
      success: false,
      statusCode: e.statusCode || 500,
      errorMessage: e.message,
      errorBody: e.error.error.details[0].message || null,
    };
  }
}

module.exports = {
  callGraphApi,
};
