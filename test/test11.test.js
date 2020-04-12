const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    onConsumerIdle,
    onConsumerUp,
} = require('./common');
const { Message } = require('../');


test('A message is delivered only once to one consumer', async () => {
    /**
     *
     */
    const consumer1 = getConsumer();
    const mock1 = jest.fn((msg, cb) => {
        cb();
    });
    consumer1.consume = mock1;
    let reQueuedCount1 = 0;
    let consumedCount1 = 0;
    consumer1
        .on('message.requeued', () => {
            reQueuedCount1 += 1;
        })
        .on('message.consumed', () => {
            consumedCount1 += 1;
        });

    /**
     *
     */
    const consumer2 = getConsumer();
    const mock2 = jest.fn((msg, cb) => {
        cb();
    });
    consumer2.consume = mock2;
    let reQueuedCount2 = 0;
    let consumedCount2 = 0;
    consumer2
        .on('message.requeued', () => {
            reQueuedCount2 += 1;
        })
        .on('message.consumed', () => {
            consumedCount2 += 1;
        });

    /**
     *
     */
    consumer1.run();
    consumer2.run();

    /**
     *
     */
    await onConsumerIdle(consumer1, () => {});
    await onConsumerIdle(consumer2, () => {});

    /**
     *
     */
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    const producer = getProducer();
    await producer.produceMessageAsync(msg);

    /**
     *
     */
    await bluebird.delay(10000);

    /**
     *
     */
    await onConsumerIdle(consumer1, () => {});
    await onConsumerIdle(consumer2, () => {});

    /**
     *
     */
    expect(reQueuedCount1).toBe(0);
    expect(reQueuedCount2).toBe(0);
    expect(consumedCount1 + consumedCount2).toBe(1);
});
