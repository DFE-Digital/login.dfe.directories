const getUserDevices = async (userId) => {
  return [
    {
      type: 'digipass',
      serialNumber: '123456',
    },
  ];
};

module.exports = {
  getUserDevices,
};
