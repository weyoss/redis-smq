'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 10: A message is not lost in case of a consumer crash', function() {

    it('is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();

        /**
         * First consumer
         * Tries to consume a message but "crushes" (stops) while message is not acknowledged
         */

        const consumer1 = this.sandbox.getConsumer();
        consumer1.on('halt', () => {
            // once stopped, start another consumer
            consumer2.run();
            setTimeout(() => {
                consumer2.once('idle', () => {
                        expect(reQueuedCount).to.eq(1);
                        expect(consumedCount).to.eq(1);
                        done();
                    });
            }, 10000)
        });

        this.sandbox.stub(consumer1, 'consume', (msg, cb) => {
            // do not acknowledge/unacknowledge the message
            consumer1.stop();
        });
        consumer1.run();


        /**
         * Second consumer
         * Requeue failed message and consume it!
         */

        const consumer2 = this.sandbox.getConsumer();
        this.sandbox.stub(consumer2, 'consume', (msg, cb) => {
            cb();
        });
        let reQueuedCount = 0;
        let consumedCount = 0;
        consumer2
            .on('message.requeued', () => {
                reQueuedCount += 1;
            })
            .on('message.consumed', () => {
                consumedCount += 1;
            });



        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
        });
    });

});
