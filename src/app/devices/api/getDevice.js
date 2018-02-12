const { getUserAssociatedToDevice } = require('./../data');

const getDevice = async (req, res) => {
  const userIdAssociatedToDevice = await getUserAssociatedToDevice(req.params.type, req.params.serial_number, req.id);
  if (!userIdAssociatedToDevice) {
    return res.status(404).send();
  }

  res.contentType('json').send({
    associatedWith: {
      sub: userIdAssociatedToDevice,
    },
  });
};

module.exports = getDevice;
