const { listUserDeviceAssociations } = require('./../data');

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

const listDevices = async (req, res) => {
  const pageNumber = extractPageNumber(req);
  const pageSize = extractPageSize(req);
  const correlationId = req.get('x-correlation-id');

  const page = await listUserDeviceAssociations(pageNumber, pageSize, correlationId);
  return res.json(page);
};

module.exports = listDevices;