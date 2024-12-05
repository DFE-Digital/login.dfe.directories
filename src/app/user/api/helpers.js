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

module.exports = {
  isUuid,
  addLegacyUsernames,
};
