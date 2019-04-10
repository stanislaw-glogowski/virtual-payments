# Virtual Payments for Ethereum

### Installation

```bash
$ npm i
```

### Run tests

```bash
$ npm test
```

```
Contract: VirtualPaymentManager
  views
    guardian()
      ✓ expect to return guardian address
    depositWithdrawalLockPeriod()
      ✓ expect to return lock period
    deposits()
      ✓ expect to return sender deposit
    payments()
      ✓ expect to return sender payment
  methods
    payable()
     ⛽ gas used: 42837
      ✓ expect to create new deposit (54ms)
    depositPayment()
     ⛽ gas used: 96626
      ✓ expect to deposit payment (90ms)
    withdrawPayment()
     ⛽ gas used: 83581
      ✓ expect to withdraw payment (98ms)
    withdrawDeposit()
     ⛽ gas used: 43490
      ✓ expect to create withdrawal request (49ms)
     ⛽ gas used: 20757
      ✓ expect to process withdraw (63ms)
```
