const logger = require("./../../../infrastructure/logger");
const storage = require("./../data");

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

const listInvitations = async (req, res) => {
  try {
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

    const invitations = await storage.list(pageNumber, pageSize, changedAfter);

    res.contentType("json").send(invitations);
  } catch (e) {
    logger.error(e);
    res.status(500).send();
  }
};

module.exports = listInvitations;
