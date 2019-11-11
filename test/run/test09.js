'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 9: A consumer re-queues a failed message when threshold is not exceeded, otherwise it moves the message to DLQ (dead letter queue)', function() {

    it('is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.stub(consumer, 'consume');

        consume.onCall(0).throws('Error');
        consume.onCall(1).throws('Error');
        consume.onCall(2).throws('Error');
        consume.onCall(3).throws('Error');

        let reQueuedCount = 0;
        consumer.on('message.requeued', () => {
            reQueuedCount += 1;
        });

        let deadCount = 0;
        consumer.on('message.moved_to_dlq', () => {
            deadCount += 1;
        });

        consumer.once('idle', () => {
            expect(reQueuedCount).to.eq(2);
            expect(deadCount).to.eq(1);
            done();
        });

        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
            consumer.run();
        });
    });

});
