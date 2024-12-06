const logger = require("./../../../infrastructure/logger");
const adapter = require("./../adapter");
const { safeUser } = require("./../../../utils");
const { listUsersCodes } = require("./../userCodes");

const extractPageNumber = (req) => {
  if (!req.query || req.query.page === undefined) {
    return 1;
  }

  const pageNumber = parseInt(req.query.page);
  return isNaN(pageNumber) ? 0 : pageNumber;
};
const extractPageSize = (req) => {
  if (!req.query || req.query.pageSize === undefined) {
    return 25;
  }

  const pageSize = parseInt(req.query.pageSize);
  return isNaN(pageSize) ? 0 : pageSize;
};
const extractChangedAfter = (req) => {
  if (!req.query || req.query.changedAfter === undefined) {
    return undefined;
  }

  const changedAfter = new Date(req.query.changedAfter);
  if (isNaN(changedAfter.valueOf())) {
    return null;
  }
  return changedAfter;
};

const unpackIncludes = (req) => {
  if (!req.query || !req.query.include) {
    return [];
  }

  return req.query.include.split(",").map((x) => x.trim().toLowerCase());
};

const getSafePageOfUsers = async (pageNumber, pageSize, changedAfter) => {
  const pageOfUsers = await adapter.list(pageNumber, pageSize, changedAfter);
  return {
    users: pageOfUsers ? pageOfUsers.users.map((u) => safeUser(u)) : [],
    numberOfPages: pageOfUsers ? pageOfUsers.numberOfPages : 0,
  };
};
const addLegacyUsernames = async (pageOfUsers, correlationId) => {
  const uids = pageOfUsers.users.map((u) => u.sub);
  const legacyUsernames = await adapter.getLegacyUsernames(uids, correlationId);
  for (let i = 0; i < pageOfUsers.users.length; i++) {
    const user = pageOfUsers.users[i];
    const userLegacyUsernames = legacyUsernames.filter(
      (lun) => lun.uid.toLowerCase() === user.sub.toLowerCase(),
    );
    if (userLegacyUsernames && userLegacyUsernames.length > 0) {
      user.legacyUsernames = userLegacyUsernames.map(
        (lun) => lun.legacy_username,
      );
    }
  }
};
const addUserCodes = async (pageOfUsers, correlationId) => {
  for (let i = 0; i < pageOfUsers.users.length; i++) {
    const user = pageOfUsers.users[i];
    user.codes = await listUsersCodes(user.sub.toLowerCase(), correlationId);
  }
};

const list = async (req, res) => {
  const pageNumber = extractPageNumber(req);
  if (pageNumber < 1) {
    return res.status(400).send();
  }

  const pageSize = extractPageSize(req);
  if (pageSize < 1) {
    return res.status(400).send("pageSize must be greater than 0");
  } else if (pageSize > 500) {
    return res.status(400).send("pageSize must not be greater than 500");
  }

  const changedAfter = extractChangedAfter(req);
  if (changedAfter === null) {
    return res
      .status(400)
      .send(
        "changedAfter must be a valid date. (Use format YYYY-MM-DDTHH:MM:SSZ)",
      );
  }

  const correlationId = req.header("x-correlation-id");
  const include = unpackIncludes(req);

  try {
    const safePageOfUsers = await getSafePageOfUsers(
      pageNumber,
      pageSize,
      changedAfter,
    );

    if (include.find((x) => x.toLowerCase() === "legacyusernames")) {
      await addLegacyUsernames(safePageOfUsers, correlationId);
    }
    if (include.find((x) => x.toLowerCase() === "codes")) {
      await addUserCodes(safePageOfUsers, correlationId);
    }

    return res.contentType("json").send(JSON.stringify(safePageOfUsers));
  } catch (e) {
    logger.error(`Error listing users page ${pageNumber} - ${e}`);
    return res.status(500).send();
  }
};

module.exports = list;
