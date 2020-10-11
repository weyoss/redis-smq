const bluebird = require('bluebird');
const { getConsumer, getProducer, untilConsumerIdle, untilConsumerUp } = require('./common');
const { Message } = require('../');
const events = require('../src/events');

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
        .on(events.MESSAGE_REQUEUED, () => {
            reQueuedCount1 += 1;
        })
        .on(events.MESSAGE_ACKNOWLEDGED, () => {
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
        .on(events.MESSAGE_REQUEUED, () => {
            reQueuedCount2 += 1;
        })
        .on(events.MESSAGE_ACKNOWLEDGED, () => {
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
    await untilConsumerIdle(consumer1);
    await untilConsumerIdle(consumer2);

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
    await untilConsumerIdle(consumer1);
    await untilConsumerIdle(consumer2);

    /**
     *
     */
    expect(reQueuedCount1).toBe(0);
    expect(reQueuedCount2).toBe(0);
    expect(consumedCount1 + consumedCount2).toBe(1);
});
