'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 15: A consumer waits for retry delay before consuming again a failed message when threshold not reached', function() {

    it('Case 1: is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.getProducer('test_queue');
        const consumer = this.sandbox.getConsumer('test_queue', { messageRetryDelay: 10 });

        let callCount = 0;
        let delayedCount = 0;
        let consumedCount = 0;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            callCount += 1;
            if (callCount === 1) throw new Error('Explicit error');
            else if (callCount === 2) cb();
            else throw new Error('Unexpected call');
        });

        consumer.on('message.delayed', () => {
            delayedCount += 1;
            setTimeout(() => {
                expect(delayedCount).to.eq(1);
                expect(consumedCount).to.eq(1);
                done();
            }, 15000);
        });

        consumer.on('message.consumed', () => {
            consumedCount += 1;
        });

        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
            consumer.run();
        });
    });
});
