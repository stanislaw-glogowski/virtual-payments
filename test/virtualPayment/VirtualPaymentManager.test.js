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
  let manager;
  let gasPrice;

  before(async () => {
    gasPrice = await getGasPrice();
  });

  describe('views', () => {
    before(async () => {
      manager = await VirtualPaymentManager.new(
        guardian,
      );
    });
  });

  describe('methods', () => {
    let senderDeposit;

    before(async () => {
      manager = await VirtualPaymentManager.new(
        guardian,
      );
    });

    describe('payable()', () => {
      it('expect to create new deposit', async () => {
        const VALUE = new BN(500);

        const output = await manager.send(VALUE, {
          from: sender,
        });

        logGasUsed(output);

        const { event, args } = output.logs[0];
        expect(event)
          .toBe('NewDeposit');
        expect(args.sender)
          .toBe(sender);
        expect(args.value)
          .toBeBN(VALUE);

        senderDeposit = VALUE;
      });
    });

    describe('depositPayment()', () => {
      it('expect to deposit payment', async () => {
        const ID = new BN(1);
        const VALUE = new BN(100);

        const messageHash = soliditySha3(
          manager.address,
          sender,
          receiver,
          ID,
          VALUE,
        );

        const senderSignature = await sign(messageHash, sender);
        const guardianSignature = await sign(messageHash, guardian);

        const output = await manager.depositPayment(
          sender,
          receiver,
          ID,
          VALUE,
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
            .toBeBN(ID);
          expect(args.value)
            .toBeBN(VALUE);
        }

        {
          const { event, args } = output.logs[1];
          expect(event)
            .toBe('NewDeposit');
          expect(args.sender)
            .toBe(receiver);
          expect(args.value)
            .toBeBN(VALUE);
        }

        senderDeposit = senderDeposit.sub(VALUE);
      });
    });

    describe('withdrawPayment()', () => {
      it('expect to withdraw payment', async () => {
        const ID = new BN(2);
        const VALUE = new BN(200);

        const messageHash = soliditySha3(
          manager.address,
          sender,
          receiver,
          ID,
          VALUE,
        );

        const senderSignature = await sign(messageHash, sender);
        const guardianSignature = await sign(messageHash, guardian);

        const receiverBalance = await getBalance(receiver);

        const output = await manager.withdrawPayment(
          sender,
          receiver,
          ID,
          VALUE,
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
            .toBeBN(ID);
          expect(args.value)
            .toBeBN(VALUE);
        }

        {
          const { event, args } = output.logs[1];
          expect(event)
            .toBe('NewWithdrawal');
          expect(args.receiver)
            .toBe(receiver);
          expect(args.value)
            .toBeBN(VALUE);
        }

        expect(await getBalance(receiver))
          .toBeBN(receiverBalance.add(VALUE));

        senderDeposit = senderDeposit.sub(VALUE);
      });
    });

    describe('withdrawDeposit()', () => {
      const LOCK_PERIOD = new BN(24 * 60 * 60); // 1 day

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
