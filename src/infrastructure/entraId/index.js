const { callGraphApi } = require('./utils');
const { getClientAppToken, tokenRequest, apiConfig } = require('./auth');

async function getAllEntraUsers() {
  try {
    const { accessToken } = await getClientAppToken(tokenRequest);

    const user = await callGraphApi(`${apiConfig.uri}/users`, 'GET', accessToken);
    return user;
  } catch (error) {
    console.log('Error fetching users:', error);
    throw error;
  }
}

async function getEntraAccountByEmail(email) {
  try {
    const { accessToken } = await getClientAppToken(tokenRequest);
    const encodedEmail = encodeURIComponent(email);
    const result = await callGraphApi(`${apiConfig.uri}/users?$filter=mail eq '${encodedEmail}'`, 'GET', accessToken);
    return result.value;
  } catch (error) {
    console.log('Error fetching users:', error);
    throw error;
  }
}

async function getEntraAccountByEntraSub(entraSub) {
  try {
    const { accessToken } = await getClientAppToken(tokenRequest);

    const result = await callGraphApi(`${apiConfig.uri}/users/${entraSub}`, 'GET', accessToken);
    return result;
  } catch (error) {
    console.log('Error fetching users:', error);
    throw error;
  }
}


async function createEntraIdUserAccount(accountDetails) {
  try {
    const { accessToken } = await getClientAppToken(tokenRequest);
    const userAccount = await callGraphApi(`${apiConfig.uri}/users`, 'POST', accessToken, accountDetails);
    console.log(userAccount);
    return userAccount;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function createTemporaryAccessPass(entraSub, temporaryAccessPassAuthenticationMethod) {
  try {
    const { accessToken } = await getClientAppToken(tokenRequest);
    const endpointUrl = `${apiConfig.uri}/users/${entraSub}/authentication/temporaryAccessPassMethods`;
    const userAccount = await callGraphApi(endpointUrl, 'POST', accessToken, temporaryAccessPassAuthenticationMethod);
    return userAccount;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function updateEntraIdUser(entraSub, passwordProfileData) {
  try {
    const { accessToken } = await getClientAppToken(tokenRequest);
    const endpointUrl = `${apiConfig.uri}/users/${entraSub}`;
    const userAccount = await callGraphApi(endpointUrl, 'PATCH', accessToken, passwordProfileData);
    return userAccount;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = {
  getAllEntraUsers,
  getEntraAccountByEmail,
  createEntraIdUserAccount,
  createTemporaryAccessPass,
  getEntraAccountByEntraSub,
  updateEntraIdUser,
};
