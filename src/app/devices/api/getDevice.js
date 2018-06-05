const { getUserAssociatedToDevice } = require('./../data');
const invitationStorage = require('./../../invitations/data/redisInvitationStorage');

const getInvitationIdAssociatedToDevice = async (type, serialNumber) => {
  if (type !== 'digipass') {
    return null;
  }

  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages) {
    const page = await invitationStorage.list(pageNumber, 100);

    const invitation = page.invitations.find(i => i.tokenSerialNumber === serialNumber
      || (i.oldCredentials && i.oldCredentials.tokenSerialNumber === serialNumber));
    if (invitation && !invitation.isCompleted) {
      return invitation.id;
    }

    pageNumber += 1;
    hasMorePages = pageNumber <= page.numberOfPages;
  }

  return null;
};

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
