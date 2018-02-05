const { find, update } = require('./../adapter');

const allowablePatchProperties = ['given_name', 'family_name', 'email'];
const allowablePropertiesMessage = allowablePatchProperties.concat();

const validateRequestData = (req) => {
  const keys = Object.keys(req.body);
  const errorMessages = keys.map((key) => {
    if (!allowablePatchProperties.find(x => x === key)) {
      return `Unpatchable property ${key}. Allowed properties ${allowablePropertiesMessage}`
    }
    return null;
  });
  return errorMessages.find(x => x !== null);
};

const patchUser = async (req, res) => {
  // Get user
  const user = await find(req.params.id, req.header('x-correlation-id'));
  if (!user) {
    return res.status(404).send();
  }

  // Check request is valid
  const validationErrorMessage = validateRequestData(req);
  if (validationErrorMessage) {
    return res.status(400).send(validationErrorMessage);
  }

  // Patch user
  const updatedUser = Object.assign(Object.assign({}, user), req.body);
  await update(updatedUser, req.header('x-correlation-id'));

  return res.status(202).send();
};

module.exports = patchUser;
