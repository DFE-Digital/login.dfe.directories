const { getUserAssociatedToDevice } = require('./../data');
const { getInvitationIdAssociatedToDevice } = require('./../../invitations/data');

const getDevice = async (req, res) => {
  const userIdAssociatedToDevice = await getUserAssociatedToDevice(req.params.type, req.params.serial_number, req.id);
  if (userIdAssociatedToDevice) {
    return res.contentType('json').send({
      associatedWith: {
        type: 'user',
        sub: userIdAssociatedToDevice,
      },
    });
  }

  const invitationIdAssocaitedToDevice = await getInvitationIdAssociatedToDevice(req.params.type, req.params.serial_number, req.id);
  if (invitationIdAssocaitedToDevice) {
    return res.contentType('json').send({
      associatedWith: {
        type: 'invitation',
        sub: invitationIdAssocaitedToDevice,
      },
    });
  }

  return res.status(404).send();
};

module.exports = getDevice;
