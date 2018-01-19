const logger = require('./../../../infrastructure/logger');
const adapter = require('./../adapter');
const { safeUser } = require('./../../../utils');

const extractPageNumber = (req) => {
  if (!req.query || req.query.page === undefined) {
    return 1;
  }

  const pageNumber = parseInt(req.query.page);
  return isNaN(pageNumber) ? 0 : pageNumber;
};

const list = async (req, res) => {
  const pageNumber = extractPageNumber(req);
  if (pageNumber < 1) {
    return res.status(400).send();
  }

  try {
    const pageOfUsers = await adapter.list(pageNumber, 25);
    const safePageOfUsers = {
      users: pageOfUsers ? pageOfUsers.users.map((u) => safeUser(u)) : [],
      numberOfPages: pageOfUsers ? pageOfUsers.numberOfPages : 0,
    };
    return res.contentType('json').send(JSON.stringify(safePageOfUsers));
  } catch (e) {
    logger.error(`Error listing users page ${pageNumber} - ${e}`);
    return res.status(500).send();
  }
};

module.exports = list;