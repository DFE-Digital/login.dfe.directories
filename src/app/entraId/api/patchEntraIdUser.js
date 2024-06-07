const { updateEntraIdUser, getEntraAccountByEntraSub } = require('../../../infrastructure/entraId/index');

const patchableProperties = ['passwordProfile'];
const patchablePropertiesMessage = patchableProperties.concat();

const validatePatchProperties = (req) => {
  const patchProperties = req.body ? Object.keys(req.body) : [];
  if (patchProperties.length === 0) {
    return 'No properties specified for patching';
  }

  const propertyError = patchProperties.map((property) => {
    if (!patchableProperties.find((x) => x === property)) {
      return `Invalid property patched - ${property}. Patchable properties are ${patchablePropertiesMessage}`;
    }
    return null;
  }).find((x) => x !== null);
  if (propertyError) {
    return propertyError;
  }
  return null;
};

const patchEntraIdUser = async (req, res) => {
  try {
    const entraIdUser = await getEntraAccountByEntraSub(req.params.entraSub);
    if (!entraIdUser) {
      return res.status(404).send({
        error: 'Entra ID user not found',
        message: `No user found with entra sub: ${req.params.entraSub}`,
      });
    }
    const requestError = validatePatchProperties(req);
    if (requestError) {
      return res.status(400).send(requestError);
    }

    const result = await updateEntraIdUser(req.params.entraSub, req.body);
    if (result) {
      return res.status(200).send({
        success: true,
        message: 'User updated successfully',
        data: result,
      });
    }
    return res.status(200).send({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

module.exports = patchEntraIdUser;
