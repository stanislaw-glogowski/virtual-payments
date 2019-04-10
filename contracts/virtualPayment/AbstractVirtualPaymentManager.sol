pragma solidity ^0.5.2;

/**
 * @title Abstract Virtual Payment Manager
 */
contract AbstractVirtualPaymentManager {

  event NewDeposit(address sender, uint256 value);
  event NewWithdrawal(address receiver, uint256 value);
  event NewWithdrawalRequest(address receiver, uint256 unlockedAt);
  event NewPayment(address sender, address receiver, uint256 id, uint256 value);

  struct Deposit {
    uint256 value;
    uint256 withdrawalUnlockedAt;
  }

  struct Payment {
    uint256 value;
  }

  mapping(address => Deposit) public deposits;
  mapping(bytes32 => Payment) public payments;

  address public guardian;
  uint256 public depositWithdrawalLockPeriod;

  function depositPayment(
    address _sender,
    address _receiver,
    uint256 _id,
    uint256 _value,
    bytes memory _senderSignature,
    bytes memory _guardianSignature
  ) public;

  function withdrawPayment(
    address _sender,
    address payable _receiver,
    uint256 _id,
    uint256 _value,
    bytes memory _senderSignature,
    bytes memory _guardianSignature
  ) public;

  function withdrawDeposit() public;
}
