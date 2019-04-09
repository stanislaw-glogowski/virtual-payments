const {
  currentProvider,
  eth: { sign, getGasPrice, getBalance },
  utils: { soliditySha3, BN },
} = web3;

module.exports = {
  BN,
  sign,
  soliditySha3,

  increaseTime: seconds => new Promise((resolve, reject) => {
    currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [
        BN.isBN(seconds) ? seconds.toNumber() : seconds,
      ],
      id: Date.now(),
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(new BN(data.result));
      }
    });
  }),

  logGasUsed: ({ receipt: { gasUsed } }) => console.log(
    `${' '.repeat(7)}⛽ gas used: ${gasUsed}`,
  ),

  getGasPrice: () => getGasPrice()
    .then(value => new BN(value, 10)),

  getBalance: address => getBalance(address)
    .then(value => new BN(value, 10)),

  getCost: ({ receipt: { gasUsed } }, gasPrice) => gasPrice.mul(new BN(gasUsed)),

  now: () => new BN(Math.floor(Date.now() / 1000)),
};
