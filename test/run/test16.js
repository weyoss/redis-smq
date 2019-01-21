'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 16: Given many queues, a message is not lost and re-queued to its origin queue in case of a consumer crash or failure', function() {

    it('OK', function (done) {
        this.timeout(20000);

        const producer1QueueA = this.sandbox.getProducer('queue_a');
        const consumer1QueueA = this.sandbox.getConsumer('queue_a');
        const consumer2QueueA = this.sandbox.getConsumer('queue_a');

        const producer1QueueB = this.sandbox.getProducer('queue_b');
        const consumer1QueueB = this.sandbox.getConsumer('queue_b');

        const queueAReceivedMessages = [];
        const queueBReceivedMessages = [];
        let queueAReQueuedCount = 0;
        let queueAConsumedCount = 0;
        let queueBReQueuedCount = 0;
        let queueBConsumedCount = 0;

        /**
         *
         */
        consumer1QueueA.on('halt', () => {
            // once stopped, start another consumer
            consumer2QueueA.run();
        });
        this.sandbox.stub(consumer1QueueA, 'consume', (msg, cb) => {
            // do not acknowledge/unacknowledge the message
            queueAReceivedMessages.push(msg);
            consumer1QueueA.stop();
        });
        consumer1QueueA.run();

        /**
         *
         */
        this.sandbox.stub(consumer2QueueA, 'consume', (msg, cb) => {
            queueAReceivedMessages.push(msg);
            cb();
        });
        consumer2QueueA
            .on('message.requeued', () => {
                queueAReQueuedCount += 1;
            })
            .on('message.consumed', () => {
                queueAConsumedCount += 1;
            })
            .once('idle', () => {
                expect(queueAReQueuedCount).to.eq(1);
                expect(queueAConsumedCount).to.eq(1);
                expect(queueBReQueuedCount).to.eq(0);
                expect(queueBConsumedCount).to.eq(1);
                expect(queueAReceivedMessages[0].id).to.eq('a');
                expect(queueAReceivedMessages[1].id).to.eq('a');
                expect(queueBReceivedMessages[0].id).to.eq('b');
                done();
            });

        /**
         *
         */
        this.sandbox.stub(consumer1QueueB, 'consume', (msg, cb) => {
            queueBReceivedMessages.push(msg);
            cb();
        });
        consumer1QueueB
            .on('message.requeued', () => {
                queueBReQueuedCount += 1;
            })
            .on('message.consumed', () => {
                queueBConsumedCount += 1;
            });
        consumer1QueueB.run();

        /**
         *
         */
        producer1QueueA.produce({ id: 'a', hello: 'world' }, (err) => {
            if (err) throw err;
        });
        producer1QueueB.produce({ id: 'b', hello: 'world' }, (err) => {
            if (err) throw err;
        });

    });

});
