'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

function produceNTimes(producer, n, cb) {
    n -= 1;
    if (n >= 0) {
        producer.produce({'hello': 'world'}, (err) => {
            if (err) cb(err);
            else produceNTimes(producer, n, cb);
        });
    } else cb();
}

describe('RedisSMQ Tests:', function () {

    it('A consumer does not a consume a message when no messages are produced', function (done) {
        this.timeout(20000);
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');
        consumer.once('idle', () => {
            expect(consume).to.have.been.callCount(0);
            done();
        });
        consumer.run();
    });

    it('Produce and consume 1 message', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');
        consumer.once('idle', () => {
            expect(consume).to.have.been.calledWith({'hello': 'world'}).callCount(1);
            done();
        });
        producer.produce({'hello': 'world'}, (err) => {
            if (err) throw  err;
            consumer.run();
        });
    });

    it('Produce and consume 100 messages', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');

        consumer.once('idle', () => {
            expect(consume).to.have.been.calledWith({'hello': 'world'}).callCount(100);
            done();
        });

        produceNTimes(producer, 100, (err) => {
            if (err) throw  err;
            consumer.run();
        });
    });

    it('A message produced with TTL is not consumed and get destroyed when TTL exceeds', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');

        let messageDestroyed = 0;
        consumer.on('message_destroyed', () => {
            messageDestroyed += 1;
        });
        consumer.once('idle', () => {
            expect(consume).to.have.been.callCount(0);
            expect(messageDestroyed).to.eq(1);
            done();
        });
        producer.produceWithTTL({'hello': 'world'}, 3000, (err) => {
            if (err) throw  err;
            setTimeout(() => {
                consumer.run();
            }, 5000);
        });
    });

    it('A consumer with message TTL does not consume a message being in the queue for longer than TTL', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer({ messageTTL: 2000 });
        const consume = this.sandbox.spy(consumer, 'consume');

        let messageDestroyed = 0;
        consumer.on('message_destroyed', () => {
            messageDestroyed += 1;
        });
        consumer.once('idle', () => {
            expect(consume).to.have.been.callCount(0);
            expect(messageDestroyed).to.eq(1);
            done();
        });
        producer.produce({'hello': 'world'}, (err) => {
            if (err) throw  err;
            setTimeout(() => {
                consumer.run();
            }, 5000);
        });
    });

    it('A consumer does time out after consume timeout exceeds and requeue the message to be consumed again', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer({ messageConsumeTimeout: 2000 });

        let consumeCount = 0;
        this.sandbox.stub(consumer, 'consume', function (msg, cb) {
            if (consumeCount === 0) setTimeout(cb, 5000);
            else if (consumeCount === 1) cb();
            else throw new Error('Unexpected call');
            consumeCount += 1
        });

        let consumeTimeout = 0;
        consumer.on('consume_timeout', () => {
            consumeTimeout += 1;
        });

        let queuedCount = 0;
        consumer.on('message_requeued', () => {
            queuedCount += 1;
        });

        let consumedCount = 0;
        consumer.on('message_consumed', () => {
            consumedCount += 1;
        });

        consumer.once('idle', () => {
            expect(consumeTimeout).to.eq(1);
            expect(queuedCount).to.eq(1);
            expect(consumedCount).to.eq(1);
            done();
        });

        produceNTimes(producer, 1, (err) => {
            if (err) throw  err;
            consumer.run();
        });

    });

    it('A consumer re-queues and consumes again failed message when threshold not reached', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();

        let callCount = 0;
        this.sandbox.stub(consumer, 'consume', function (msg, cb) {
            callCount += 1;
            if (callCount === 1) throw new Error('Explicit error');
            else if (callCount === 2) cb();
            else throw new Error('Unexpected call');
        });

        let queuedCount = 0;
        consumer.on('message_requeued', () => {
            queuedCount += 1;
        });

        let consumedCount = 0;
        consumer.on('message_consumed', () => {
            consumedCount += 1;
        });

        consumer.once('idle', () => {
            expect(queuedCount).to.eq(1);
            expect(consumedCount).to.eq(1);
            done();
        });

        produceNTimes(producer, 1, (err) => {
            if (err) throw  err;
            consumer.run();
        });

    });

    it('A consumer re-queues a failed message when threshold not reached and moves it to dead queue when threshold reached', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.stub(consumer, 'consume');

        consume.onCall(0).throws('Error');
        consume.onCall(1).throws('Error');
        consume.onCall(2).throws('Error');
        consume.onCall(3).throws('Error');

        let reQueuedCount = 0;
        consumer.on('message_requeued', () => {
            reQueuedCount += 1;
        });

        let deadCount = 0;
        consumer.on('message_dead_queue', () => {
            deadCount += 1;
        });

        consumer.once('idle', () => {
            expect(reQueuedCount).to.eq(2);
            expect(deadCount).to.eq(1);
            done();
        });

        produceNTimes(producer, 1, (err) => {
            if (err) throw  err;
            consumer.run();
        });
    });

    it('A message is not lost in case of a consumer crush', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;

        /**
         * First consumer
         * Tries to consume a message but "crushes" (stops) while message is not acknowledged
         */

        const consumer = this.sandbox.getConsumer();
        this.sandbox.stub(consumer, 'consume', function (msg, cb) {
            // Acknowledge the message consumption 5 seconds after received (busy)
            setTimeout(() => {
                cb();
            }, 5000);
        });


        /**
         * Second consumer
         * Requeue failed message and consume it!
         */

        const anotherConsumer = this.sandbox.getConsumer();
        this.sandbox.stub(anotherConsumer, 'consume', function (msg, cb) {
            cb();
        });
        let reQueuedCount = 0;
        let consumedCount = 0;
        anotherConsumer
            .on('message_requeued', () => {
                reQueuedCount += 1;
            })
            .on('message_consumed', () => {
                consumedCount += 1;
            })
            .once('idle', () => {
                expect(reQueuedCount).to.eq(1);
                expect(consumedCount).to.eq(1);
                done();
            });

        produceNTimes(producer, 1, (err) => {
            if (err) throw  err;
            consumer.run();

            // stop consumer after 2 seconds and before the message is consumed
            // the message should remain in the processing queue
            setTimeout(() => {
                consumer.on('halt', () => {

                    // once stopped, start another consumer after 4 seconds
                    setTimeout(() => {
                        anotherConsumer.run();
                    }, 4000);
                });
                consumer.stop();
            }, 2000);
        });
    });

    it('A message is delivered only once to one consumer', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;

        /**
         * First consumer
         */

        const consumer = this.sandbox.getConsumer();
        this.sandbox.stub(consumer, 'consume', function (msg, cb) {
            cb();
        });
        let reQueuedCount1 = 0;
        let consumedCount1 = 0;
        let idle1 = false;
        consumer
            .on('message_requeued', () => {
                reQueuedCount1 += 1;
            })
            .on('message_consumed', () => {
                consumedCount1 += 1;
            })
            .once('idle', () => {
                idle1 = true;
            });
        consumer.run();

        /**
         * Second consumer
         */

        const anotherConsumer = this.sandbox.getConsumer();
        this.sandbox.stub(anotherConsumer, 'consume', function (msg, cb) {
            cb();
        });
        let reQueuedCount2 = 0;
        let consumedCount2 = 0;
        let idle2 = false;
        anotherConsumer
            .on('message_requeued', () => {
                reQueuedCount2 += 1;
            })
            .on('message_consumed', () => {
                consumedCount2 += 1;
            })
            .once('idle', () => {
                idle2 = true;
            });
        anotherConsumer.run();

        produceNTimes(producer, 1, (err) => {
            if (err) throw  err;
        });

        const check = function () {
            if (idle1 && idle1) {
                expect(reQueuedCount1).to.eq(0);
                expect(reQueuedCount2).to.eq(0);
                if (consumedCount1) {
                    expect(consumedCount1).to.eq(1);
                    expect(consumedCount2).to.eq(0);
                }
                else {
                    expect(consumedCount1).to.eq(0);
                    expect(consumedCount2).to.eq(1);
                }
                done();
            }
            else {
                setTimeout(() => {
                    check();
                }, 1000);
            }
        };

        check();
    });

});