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
    "is_internal_user",
    "entra_defer_until",
  ];
  const rawSafeUser = pick(user, safeUserFields);
  const {
    is_entra,
    entra_oid,
    entra_linked,
    is_internal_user,
    entra_defer_until,
    ...rest
  } = rawSafeUser;

  return {
    ...rest,
    isEntra: is_entra,
    entraOid: entra_oid,
    entraLinked: entra_linked,
    isInternalUser: is_internal_user,
    entraDeferUntil: entra_defer_until,
  };
};

module.exports = safeUser;
