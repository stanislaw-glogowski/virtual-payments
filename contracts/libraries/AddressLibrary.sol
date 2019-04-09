pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/utils/address.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

library AddressLibrary {

  using ECDSA for bytes32;

  function verifySignature(address _address, bytes32 _messageHash, bytes memory _signature) internal pure returns (bool) {
    return _address == _messageHash.toEthSignedMessageHash().recover(_signature);
  }
}
