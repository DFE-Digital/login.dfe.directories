const moment = require("moment");
const userAdapter = require("../adapter");

const isUuid = (value) =>
  !!value.match(
    /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i,
  );

const addLegacyUsernames = async (user, correlationId) => {
  const legacyUsernames = await userAdapter.getLegacyUsernames(
    [user.sub],
    correlationId,
  );
  const userLegacyUsernames = legacyUsernames.filter(
    (lun) => lun.uid.toLowerCase() === user.sub.toLowerCase(),
  );
  if (userLegacyUsernames && userLegacyUsernames.length > 0) {
    user.legacyUsernames = userLegacyUsernames.map(
      (lun) => lun.legacy_username,
    );
  }
};

const isValidDate = (date) => {
  // Check if date is a string in ISO 8601 format
  return moment(date, moment.ISO_8601, true).isValid();
};

module.exports = {
  isUuid,
  addLegacyUsernames,
  isValidDate,
};
