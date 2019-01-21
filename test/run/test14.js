'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const Message = require('../../index').Message;

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 14: Produce and consume a delayed message with scheduledCRON/scheduledRepeat/scheduledPeriod parameters', function() {

    it('Case 1: is OK', function (done) {
        this.timeout(60000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Math.floor((Date.now() - createdAt) / 1000);
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(first + 3 === diff).to.be.true;
            } else if (callCount === 3) {
                expect(first + 6 === diff).to.be.true;
            } else if (callCount === 4) {
                expect(first + 9 === diff).to.be.true;
            } else if (callCount === 5) {
                expect(first + 12 === diff).to.be.true;
            } else if (callCount === 6) {
                expect(first + 15 === diff).to.be.true;
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
        this.timeout(60000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Math.floor((Date.now() - createdAt) / 1000);
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(first + 6 === diff).to.be.true;
            } else if (callCount === 3) {
                expect(first + 12 === diff).to.be.true;
            } else if (callCount === 4) {
                expect(first + 18 === diff).to.be.true;
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
        this.timeout(60000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Math.floor((Date.now() - createdAt) / 1000);
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(first + 3 === diff).to.be.true;
            } else if (callCount === 3) {
                expect(first + 6 === diff).to.be.true;
            } else if (callCount === 4) {
                expect(first + 20 === diff).to.be.true;
            } else if (callCount === 5) {
                expect(first + 23 === diff).to.be.true;
            } else if (callCount === 6) {
                expect(first + 26 === diff).to.be.true;
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
        let createdAt = null;
        let callCount = 0;
        let first = null;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Math.floor((Date.now() - createdAt) / 1000);
            cb();

            callCount += 1;
            if (callCount === 1) {
                first = diff;
            } else if (callCount === 2) {
                expect(first + 20 === diff).to.be.true;
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
