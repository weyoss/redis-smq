const bluebird = require('bluebird');
const { getConsumer, getProducer, untilConsumerIdle } = require('./common');
const { Message } = require('../index');
const events = require('../src/events');

// eslint-disable-next-line max-len
test('When consuming a message, a consumer does time out after messageConsumeTimeout exceeds and re-queues the message to be consumed again', async () => {
    const producer = getProducer('test_queue');
    const consumer = getConsumer('test_queue', { messageConsumeTimeout: 2000 });

    let consumeCount = 0;
    const mock = jest.fn((msg, cb) => {
        if (consumeCount === 0) setTimeout(cb, 5000);
        else if (consumeCount === 1) cb();
        else throw new Error('Unexpected call');
        consumeCount += 1;
    });

    consumer.consume = mock;

    let consumeTimeout = 0;
    consumer.on(events.MESSAGE_CONSUME_TIMEOUT, () => {
        consumeTimeout += 1;
    });

    let queuedCount = 0;
    consumer.on(events.MESSAGE_REQUEUED, () => {
        queuedCount += 1;
    });

    let consumedCount = 0;
    consumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
        consumedCount += 1;
    });
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    await producer.produceMessageAsync(msg);
    consumer.run();

    await untilConsumerIdle(consumer);
    expect(consumeTimeout).toBe(1);
    expect(queuedCount).toBe(1);
    expect(consumedCount).toBe(1);
});
