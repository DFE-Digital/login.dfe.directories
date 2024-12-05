const { pick } = require("lodash");

const safeUser = (user) => {
  const safeUserFields = [
    "sub",
    "given_name",
    "family_name",
    "email",
    "job_title",
    "id",
    "status",
    "legacy_username",
    "phone_number",
    "last_login",
    "prev_login",
    "is_entra",
    "entra_oid",
    "entra_linked",
  ];
  const rawSafeUser = pick(user, safeUserFields);
  const { is_entra, entra_oid, entra_linked, ...rest } = rawSafeUser;

  return {
    ...rest,
    isEntra: rawSafeUser.is_entra,
    entraOid: rawSafeUser.entra_oid,
    entraLinked: rawSafeUser.entra_linked,
  };
};

module.exports = safeUser;
