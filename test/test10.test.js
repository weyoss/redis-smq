const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    onConsumerIdle,
    onConsumerUp,
} = require('./common');
const { Message } = require('./../');


test('A message is not lost in case of a consumer crash', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setBody({ hello: 'world' });

    await producer.produceMessageAsync(msg);

    /**
     * First consumer
     * Tries to consume a message but "crushes" (stops) while message is not acknowledged
     */

    const consumer1 = getConsumer();
    const mock1 = jest.fn((msg, cb) => {
        // do not acknowledge/unacknowledge the message
        consumer1.shutdown();
    });
    consumer1.consume = mock1;
    consumer1.on('down', () => {
        // once stopped, start another consumer
        consumer2.run();
    });

    /**
     * Second consumer
     * Requeue failed message and consume it!
     */

    const consumer2 = getConsumer();
    const mock = jest.fn((msg, cb) => {
        cb();
    });
    consumer2.consume = mock;

    let reQueuedCount = 0;
    let consumedCount = 0;
    consumer2
        .on('message.requeued', () => {
            reQueuedCount += 1;
        })
        .on('message.consumed', () => {
            consumedCount += 1;
        });
    //
    consumer1.run();

    // Once consumer2 goes up
    await onConsumerUp(consumer2, () => {});

    // Wait 10s
    await bluebird.delay(10000);
    await onConsumerIdle(consumer2, () => {
        expect(reQueuedCount).toBe(1);
        expect(consumedCount).toBe(1);
    });
});
