const bluebird = require('bluebird');
const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../index');


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
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    await producer.produceMessageAsync(msg);
    consumer.run();

    await onConsumerIdle(consumer, () => {
        expect(consumeTimeout).toBe(1);
        expect(queuedCount).toBe(1);
        expect(consumedCount).toBe(1);
    });
});
