'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 7: A consumer re-queues and consumes again a failed message when threshold not exceeded', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();

        let callCount = 0;
        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            callCount += 1;
            if (callCount === 1) throw new Error('Explicit error');
            else if (callCount === 2) cb();
            else throw new Error('Unexpected call');
        });

        let queuedCount = 0;
        consumer.on('message.requeued', () => {
            queuedCount += 1;
        });

        let consumedCount = 0;
        consumer.on('message.consumed', () => {
            consumedCount += 1;
        });

        consumer.once('idle', () => {
            expect(queuedCount).to.eq(1);
            expect(consumedCount).to.eq(1);
            done();
        });

        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
            consumer.run();
        });
    });

});
