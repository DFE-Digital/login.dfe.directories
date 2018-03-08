const getUserDevices = async userId => [
  {
    id: 'e716d7d8-5d32-4cd0-9daf-43a03fd4ed04',
    type: 'digipass',
    serialNumber: '123456',
  },
];

const createUserDevices = async (userId, device) => Promise.resolve(null);

const getUserAssociatedToDevice = async () => Promise.resolve(null);

const deleteUserDevice = async () => Promise.resolve(null);

module.exports = {
  getUserDevices,
  createUserDevices,
  getUserAssociatedToDevice,
  deleteUserDevice
};
