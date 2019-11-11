'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const Message = require('../../index').Message;

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 14: Produce and consume a delayed message with scheduledCRON/scheduledRepeat/scheduledPeriod parameters', function() {

    it('Case 1: is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;
        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Date.now() - createdAt;
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(validateTime(diff, first + 3000)).to.be.true;
            } else if (callCount === 3) {
                expect(validateTime(diff, first + 6000)).to.be.true;
            } else if (callCount === 4) {
                expect(validateTime(diff, first + 9000)).to.be.true;
            } else if (callCount === 5) {
                expect(validateTime(diff, first + 12000)).to.be.true;
            } else if (callCount === 6) {
                expect(validateTime(diff, first + 15000)).to.be.true;
            } else {
                done();
            }
        });

        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/3 * * * * *')
            .setBody({ hello: 'world' });

        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });

    it('Case 2: is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;

        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Date.now() - createdAt;
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(validateTime(diff, first + 6000)).to.be.true;
            } else if (callCount === 3) {
                expect(validateTime(diff, first + 12000)).to.be.true;
            } else if (callCount === 4) {
                expect(validateTime(diff, first + 18000)).to.be.true;
            } else {
                done();
            }
        });

        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/6 * * * * *')
            .setBody({ hello: 'world' });

        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });

    it('Case 3: is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;

        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Date.now() - createdAt;
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(validateTime(diff, first + 3000)).to.be.true;
            } else if (callCount === 3) {
                expect(validateTime(diff, first + 6000)).to.be.true;
            } else if (callCount === 4) {
                expect(validateTime(diff, first + 20000)).to.be.true;
            } else if (callCount === 5) {
                expect(validateTime(diff, first + 23000)).to.be.true;
            } else if (callCount === 6) {
                expect(validateTime(diff, first + 26000)).to.be.true;
            } else {
                done();
            }
        });

        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/20 * * * * *')
            .setScheduledRepeat(3)
            .setScheduledPeriod(3)
            .setScheduledDelay(10) // is ignored
            .setBody({ hello: 'world' });

        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });

    it('Case 4: is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;

        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Date.now() - createdAt;
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(validateTime(diff, first + 20000)).to.be.true;
            } else {
                done();
            }
        });

        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/20 * * * * *')
            .setScheduledRepeat(0)
            .setScheduledPeriod(3)
            .setScheduledDelay(10) // is ignored
            .setBody({ hello: 'world' });

        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });
});
