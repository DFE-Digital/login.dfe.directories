const Redis = require("ioredis");
const crypto = require("crypto");
const { promisify } = require("util");
const generateSalt = require("./../utils/generateSalt");
const { chunk } = require("lodash");
const { v4: uuid } = require("uuid");
const config = require("./../../../infrastructure/config");
const logger = require("./../../../infrastructure/logger");

const tls = config.adapter.params.redisurl.includes("6380");
const client = new Redis(config.adapter.params.redisurl, { tls });

const findById = async (id) => {
  const result = await client.get(`User_${id}`);
  if (!result) {
    return null;
  }
  const user = JSON.parse(result);
  return user || null;
};

const findByEmail = async (email) => {
  const result = await client.get(`User_e_${email}`);
  if (!result) {
    return null;
  }

  const userEmailResult = JSON.parse(result);
  if (!userEmailResult) {
    return null;
  }

  const user = await findById(userEmailResult.sub);
  return user || null;
};

const findByEntraId = async (entraOid) => {
  const result = await client.get(`User_entraOid_${entraOid}`);
  if (!result) {
    return null;
  }

  const userResult = JSON.parse(result);
  if (!userResult) {
    return null;
  }
  const user = await findById(userResult.sub);
  return user || null;
};

const findByUsername = async (username, correlationId) => {
  try {
    logger.info(`Get user by username for request: ${correlationId}`, {
      correlationId,
    });
    return await findByEmail(username);
  } catch (e) {
    logger.error(
      `Get user by username failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const findByEntraOid = async (entraOid, correlationId) => {
  try {
    logger.info(`Get user by entraOid for request: ${correlationId}`, {
      correlationId,
    });
    return await findByEntraId(entraOid);
  } catch (e) {
    logger.error(
      `Get user by entraOid failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const createUser = async (
  username,
  password,
  firstName,
  lastName,
  legacyUsername,
  phone_number,
  correlationId,
  entraOid = null,
) => {
  logger.info(`Create user called for request ${correlationId}`, {
    correlationId,
  });

  if (!username || !password) {
    return null;
  }

  const exists = await findByUsername(username);
  if (exists) {
    return exists;
  }

  const salt = generateSalt();
  const encryptedPassword = crypto
    .pbkdf2Sync(password, salt, 120000, 512, "sha512")
    .toString("base64");
  const id = uuid();

  const newUser = {
    id,
    sub: id,
    given_name: firstName,
    family_name: lastName,
    email: username,
    salt,
    password: encryptedPassword,
    legacy_username: legacyUsername,
    phone_number: phone_number,
    entra_oid: entraOid,
  };

  const content = JSON.stringify(newUser);
  await client.set(`User_${id}`, content);
  await client.set(`User_e_${username}`, JSON.stringify({ sub: id }));
  if (newUser.entra_oid) {
    await client.set(`User_entraOid_${entraOid}`, JSON.stringify({ sub: id }));
  }

  let users = await client.get("Users");
  users = JSON.parse(users);
  users.push({ sub: id, email: username });
  await client.set("Users", JSON.stringify(users));

  return newUser;
};

const getManyUsers = async (userIds) => {
  if (!userIds) {
    return null;
  }

  const userIdSearch = userIds.map((userId) => `User_${userId}`);

  const rawRes = await client.mget(...userIdSearch);

  return rawRes
    .filter((user) => !user === false)
    .map((user) => JSON.parse(user));
};

const changePasswordForUser = async (uid, newPassword) => {
  const result = await client.get(`User_${uid}`);
  if (!result) {
    return false;
  }
  const user = JSON.parse(result);
  if (!user) {
    return false;
  }

  const salt = generateSalt();
  const password = crypto.pbkdf2Sync(newPassword, salt, 120000, 512, "sha512");

  user.salt = salt;
  user.password = password.toString("base64");

  return !!client.set(`User_${uid}`, JSON.stringify(user));
};

const changeStatusForUser = async (uid, status) => {
  const result = await client.get(`User_${uid}`);
  if (!result) {
    return false;
  }
  const user = JSON.parse(result);
  if (!user) {
    return false;
  }

  user.status = status;

  return !!client.set(`User_${uid}`, JSON.stringify(user));
};

const find = async (id, correlationId) => {
  try {
    logger.info(`Get user by id for request: ${correlationId}`, {
      correlationId,
    });
    return await findById(id);
  } catch (e) {
    logger.error(
      `Get user by id failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const create = async (
  username,
  password,
  firstName,
  lastName,
  phone_number,
  correlationId,
  entraOid = null,
) =>
  createUser(
    username,
    password,
    firstName,
    lastName,
    phone_number,
    correlationId,
    entraOid,
  );

const findAllKeys = async () => {
  const keys = [];
  return new Promise((resolve, reject) => {
    client
      .scanStream({
        match: "User_e*",
      })
      .on("data", (resultKeys) => {
        for (let i = 0; i < resultKeys.length; i += 1) {
          keys.push(resultKeys[i]);
        }
      })
      .on("end", () => resolve(keys))
      .on("error", reject);
  });
};

const list = async (
  page = 1,
  pageSize = 10,
  changedAfter = undefined,
  correlationId,
) => {
  logger.info(`Get user list for request: ${correlationId}`, { correlationId });

  const userList = await findAllKeys();

  if (!userList) {
    return null;
  }

  const orderedUserList = userList.sort((x, y) => {
    if (x.email < y.email) {
      return -1;
    }
    if (x.email > y.email) {
      return 1;
    }
    return 0;
  });
  const pagesOfUsers = chunk(orderedUserList, pageSize);
  if (page > pagesOfUsers.length) {
    return null;
  }

  const users = await Promise.all(
    pagesOfUsers[page - 1].map(async (item) =>
      findByUsername(item.replace("User_e_", "")),
    ),
  );
  return {
    users,
    numberOfPages: pagesOfUsers.length,
  };
};

const changePassword = async (uid, newPassword, correlationId) => {
  try {
    logger.info(`Change password for request: ${correlationId}`, {
      correlationId,
    });
    return await changePasswordForUser(uid, newPassword);
  } catch (e) {
    logger.error(
      `Change password failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const changeStatus = async (uid, userStatus, correlationId) => {
  try {
    logger.info(`Change status for request: ${correlationId}`, {
      correlationId,
    });
    return await changeStatusForUser(uid, userStatus);
  } catch (e) {
    logger.error(
      `Change user status failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const getUsers = async (uids, correlationId) => {
  try {
    logger.info(`Get Users for request: ${correlationId}`, { correlationId });
    const users = await getManyUsers(uids);

    if (!users || users.length === 0) {
      return null;
    }
    return users;
  } catch (e) {
    logger.error(`GetUsers failed for request ${correlationId} error: ${e}`, {
      correlationId,
    });
    throw e;
  }
};

const authenticate = async (username, password, correlationId) => {
  logger.info(`Authenticate user for request: ${correlationId}`, {
    correlationId,
  });
  const user = await findByUsername(username);
  const latestPasswordPolicy = process.env.POLICY_CODE || "v3";

  if (!user) return null;
  const request = promisify(crypto.pbkdf2);
  const userPasswordPolicyEntity = await user.getUserPasswordPolicy();
  const userPasswordPolicyCode =
    userPasswordPolicyEntity.filter((u) => u.policyCode === "v3").length > 0
      ? "v3"
      : "v2";
  const iterations =
    userPasswordPolicyCode === latestPasswordPolicy ? 120000 : 10000;
  user.prev_login = user.last_login;
  const saltBuffer = Buffer.from(user.salt, "utf8");
  const derivedKey = await request(
    password,
    saltBuffer,
    iterations,
    512,
    "sha512",
  );

  if (derivedKey.toString("base64") === user.password) {
    return user;
  }
  return null;
};

const update = async (
  uid,
  given_name,
  family_name,
  email,
  job_title,
  phone_number,
  prev_login,
  correlationId,
) => {
  try {
    logger.info(`Updating user for request: ${correlationId}`, {
      correlationId,
    });

    const result = await client.get(`User_${uid}`);
    if (!result) {
      return;
    }

    const user = JSON.parse(result);
    user.given_name = given_name;
    user.family_name = family_name;
    user.email = email;
    user.phone_number = phone_number;
    user.job_title = job_title;

    await client.set(`User_${uid}`, JSON.stringify(user));
  } catch (e) {
    logger.error(
      `Updating user failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

const findByLegacyUsername = async (username, correlationId) => {
  throw new Error(
    "Find by legacy username is not implemented for Redis Adapter",
  );
  error.type = "E_NOTIMPLEMENTED";
  throw error;
};

const getLegacyUsernames = async (username, correlationId) => {
  throw new Error("Get legacy usernames is not implemented for Redis Adapter");
  error.type = "E_NOTIMPLEMENTED";
  throw error;
};

const updateLastLogin = async (uid, correlationId) => {
  throw new Error("updateLastLogin is not implemented for Redis Adapter");
  error.type = "E_NOTIMPLEMENTED";
  throw error;
};

module.exports = {
  getUsers,
  changePassword,
  list,
  findByUsername,
  create,
  find,
  authenticate,
  changeStatus,
  update,
  findByLegacyUsername,
  getLegacyUsernames,
  findByEntraOid,
  updateLastLogin,
};
