'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 6: A consumer does time out after consume timeout exceeds and requeue the message to be consumed again', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer({ messageConsumeTimeout: 2000 });

        let consumeCount = 0;
        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            if (consumeCount === 0) setTimeout(cb, 5000);
            else if (consumeCount === 1) cb();
            else throw new Error('Unexpected call');
            consumeCount += 1;
        });

        let consumeTimeout = 0;
        consumer.on('message.consume_timeout', () => {
            consumeTimeout += 1;
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
            expect(consumeTimeout).to.eq(1);
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
