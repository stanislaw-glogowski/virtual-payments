module.exports = {
  networks: {
    //
  },
  compilers: {
    solc: {
      version: '0.5.2',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: 'constantinople',
      },
    },
  },
};
