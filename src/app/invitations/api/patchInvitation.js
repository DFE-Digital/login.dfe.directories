const { getUserInvitation, updateInvitation } = require('./../data/redisInvitationStorage');

const patchableProperties = ['isCompleted', 'deactivated', 'reason'];
const patchablePropertiesMessage = patchableProperties.concat();

const validatePatchProperties = (req) => {
  const patchProperties = req.body ? Object.keys(req.body) : [];
  if (patchProperties.length === 0) {
    return 'No properties specified for patching';
  }

  const propertyError = patchProperties.map((property) => {
    if (!patchableProperties.find(x => x === property)) {
      return `Invalid property patched - ${property}. Patchable properties are ${patchablePropertiesMessage}`;
    }
    return null;
  }).find(x => x !== null);
  if (propertyError) {
    return propertyError;
  }
};

const patchInvitation = async (req, res) => {
  const invitation = await getUserInvitation(req.params.id, req.header('x-correlation-id'));
  if (!invitation) {
    return res.status(404).send();
  }

  const requestError = validatePatchProperties(req);
  if (requestError) {
    return res.status(400).send(requestError);
  }

  const patchedInvitation = Object.assign(invitation, req.body);
  await updateInvitation(patchedInvitation);

  return res.status(202).send();
};

module.exports = patchInvitation;
