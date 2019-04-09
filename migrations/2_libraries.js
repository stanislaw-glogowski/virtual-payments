const Address = artifacts.require('Address');
const ECDSA = artifacts.require('ECDSA');
const SafeMath = artifacts.require('SafeMath');
const AddressLibrary = artifacts.require('AddressLibrary');
const VirtualPaymentManager = artifacts.require('VirtualPaymentManager');

module.exports = async (deployer) => {
  await deployer.deploy(Address);
  await deployer.deploy(ECDSA);
  await deployer.deploy(SafeMath);

  deployer.link(Address, AddressLibrary);
  deployer.link(ECDSA, AddressLibrary);

  await deployer.deploy(AddressLibrary);

  deployer.link(SafeMath, VirtualPaymentManager);
  deployer.link(AddressLibrary, VirtualPaymentManager);
};
