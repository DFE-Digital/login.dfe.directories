const { findInvitationForEmail } = require("./../data");

const getInvitationByEmail = async (req, res) => {
  const invitation = await findInvitationForEmail(
    req.params.email,
    true,
    req.get("x-correlation-id"),
  );
  if (!invitation) {
    return res.status(404).send();
  }

  return res.send(invitation);
};

module.exports = getInvitationByEmail;
