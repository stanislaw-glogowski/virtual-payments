/* eslint-env mocha */

const expect = require('expect');
const {
  sign,
  soliditySha3,
  BN,
  increaseTime,
  logGasUsed,
  getGasPrice,
  getBalance,
  getCost,
  now,
} = require('../utils');

const VirtualPaymentManager = artifacts.require('VirtualPaymentManager');

contract('VirtualPaymentManager', ([guardian, sender, receiver]) => {
  const LOCK_PERIOD = new BN(24 * 60 * 60); // 1 day

  let manager;
  let gasPrice;

  before(async () => {
    gasPrice = await getGasPrice();
  });

  describe('views', () => {
    const DEPOSIT_VALUE = new BN(500);
    const PAYMENT_ID = new BN(1);
    const PAYMENT_VALUE = new BN(200);

    before(async () => {
      manager = await VirtualPaymentManager.new(
        guardian,
        LOCK_PERIOD,
      );

      await manager.send(DEPOSIT_VALUE, {
        from: sender,
      });

      const messageHash = soliditySha3(
        manager.address,
        sender,
        receiver,
        PAYMENT_ID,
        PAYMENT_VALUE,
      );

      const senderSignature = await sign(messageHash, sender);
      const guardianSignature = await sign(messageHash, guardian);

      await manager.depositPayment(
        sender,
        receiver,
        PAYMENT_ID,
        PAYMENT_VALUE,
        senderSignature,
        guardianSignature,
      );
    });

    describe('guardian()', () => {
      it('expect to return guardian address', async () => {
        const output = await manager.guardian();

        expect(output)
          .toBe(guardian);
      });
    });

    describe('depositWithdrawalLockPeriod()', () => {
      it('expect to return lock period', async () => {
        const output = await manager.depositWithdrawalLockPeriod();

        expect(output)
          .toBeBN(LOCK_PERIOD);
      });
    });

    describe('deposits()', () => {
      it('expect to return sender deposit', async () => {
        const { value, withdrawalUnlockedAt } = await manager.deposits(sender);

        expect(value)
          .toBeBN(DEPOSIT_VALUE.sub(PAYMENT_VALUE));
        expect(withdrawalUnlockedAt)
          .toBeBN(new BN(0));
      });
    });

    describe('payments()', () => {
      it('expect to return sender payment', async () => {
        const paymentHash = soliditySha3(
          sender,
          receiver,
          PAYMENT_ID,
        );

        const output = await manager.payments(paymentHash);

        expect(output)
          .toBeBN(PAYMENT_VALUE);
      });
    });
  });

  describe('methods', () => {
    let senderDeposit;

    before(async () => {
      manager = await VirtualPaymentManager.new(
        guardian,
        LOCK_PERIOD,
      );
    });

    describe('payable()', () => {
      it('expect to create new deposit', async () => {
        const DEPOSIT_VALUE = new BN(500);

        const output = await manager.send(DEPOSIT_VALUE, {
          from: sender,
        });

        logGasUsed(output);

        const { event, args } = output.logs[0];
        expect(event)
          .toBe('NewDeposit');
        expect(args.sender)
          .toBe(sender);
        expect(args.value)
          .toBeBN(DEPOSIT_VALUE);

        senderDeposit = DEPOSIT_VALUE;
      });
    });

    describe('depositPayment()', () => {
      it('expect to deposit payment', async () => {
        const PAYMENT_ID = new BN(1);
        const PAYMENT_VALUE = new BN(100);

        const messageHash = soliditySha3(
          manager.address,
          sender,
          receiver,
          PAYMENT_ID,
          PAYMENT_VALUE,
        );

        const senderSignature = await sign(messageHash, sender);
        const guardianSignature = await sign(messageHash, guardian);

        const output = await manager.depositPayment(
          sender,
          receiver,
          PAYMENT_ID,
          PAYMENT_VALUE,
          senderSignature,
          guardianSignature,
        );

        logGasUsed(output);

        {
          const { event, args } = output.logs[0];
          expect(event)
            .toBe('NewPayment');
          expect(args.sender)
            .toBe(sender);
          expect(args.receiver)
            .toBe(receiver);
          expect(args.id)
            .toBeBN(PAYMENT_ID);
          expect(args.value)
            .toBeBN(PAYMENT_VALUE);
        }

        {
          const { event, args } = output.logs[1];
          expect(event)
            .toBe('NewDeposit');
          expect(args.sender)
            .toBe(receiver);
          expect(args.value)
            .toBeBN(PAYMENT_VALUE);
        }

        senderDeposit = senderDeposit.sub(PAYMENT_VALUE);
      });
    });

    describe('withdrawPayment()', () => {
      it('expect to withdraw payment', async () => {
        const PAYMENT_ID = new BN(2);
        const PAYMENT_VALUE = new BN(200);

        const messageHash = soliditySha3(
          manager.address,
          sender,
          receiver,
          PAYMENT_ID,
          PAYMENT_VALUE,
        );

        const senderSignature = await sign(messageHash, sender);
        const guardianSignature = await sign(messageHash, guardian);

        const receiverBalance = await getBalance(receiver);

        const output = await manager.withdrawPayment(
          sender,
          receiver,
          PAYMENT_ID,
          PAYMENT_VALUE,
          senderSignature,
          guardianSignature, {
            gasPrice,
          },
        );

        logGasUsed(output);

        {
          const { event, args } = output.logs[0];
          expect(event)
            .toBe('NewPayment');
          expect(args.sender)
            .toBe(sender);
          expect(args.receiver)
            .toBe(receiver);
          expect(args.id)
            .toBeBN(PAYMENT_ID);
          expect(args.value)
            .toBeBN(PAYMENT_VALUE);
        }

        {
          const { event, args } = output.logs[1];
          expect(event)
            .toBe('NewWithdrawal');
          expect(args.receiver)
            .toBe(receiver);
          expect(args.value)
            .toBeBN(PAYMENT_VALUE);
        }

        expect(await getBalance(receiver))
          .toBeBN(receiverBalance.add(PAYMENT_VALUE));

        senderDeposit = senderDeposit.sub(PAYMENT_VALUE);
      });
    });

    describe('withdrawDeposit()', () => {
      it('expect to create withdrawal request', async () => {
        const output = await manager.withdrawDeposit({
          from: sender,
          gasPrice,
        });

        logGasUsed(output);

        const { event, args } = output.logs[0];
        expect(event)
          .toBe('NewWithdrawalRequest');
        expect(args.receiver)
          .toBe(sender);
        expect(args.unlockedAt)
          .toBeBN(now()
            .add(LOCK_PERIOD));
      });

      it('expect to process withdraw', async () => {
        const senderBalance = await getBalance(sender);

        await increaseTime(LOCK_PERIOD);

        const output = await manager.withdrawDeposit({
          from: sender,
          gasPrice,
        });

        logGasUsed(output);

        const { event, args } = output.logs[0];
        expect(event)
          .toBe('NewWithdrawal');
        expect(args.receiver)
          .toBe(sender);
        expect(args.value)
          .toBeBN(senderDeposit);

        expect(await getBalance(sender))
          .toBeBN(senderBalance.sub(getCost(output, gasPrice))
            .add(senderDeposit));
      });
    });
  });
});
