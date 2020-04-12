const bluebird = require('bluebird');
const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../index');


test('Async exceptions are caught when consuming a message', async () => {
    const producer = getProducer();
    const consumer = getConsumer();

    let callCount = 0;
    const mock = jest.fn((msg, cb) => {
        callCount += 1;
        if (callCount === 1) {
            setTimeout(() => {
                cb(new Error('Async error'));
            }, 2000);
        } else if (callCount === 2) cb();
        else throw new Error('Unexpected call');
    });

    consumer.consume = mock;

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
        expect(queuedCount).toBe(1);
        expect(consumedCount).toBe(1);
    });
});
