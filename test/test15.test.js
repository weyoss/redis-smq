const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    onConsumerIdle,
    onConsumerUp,
    onMessageConsumed,
    validateTime,
} = require('./common');


test('A consumer delays a failed message before re-queuing it again, given messageRetryThreshold is not exceeded', async () => {
    const consumer = getConsumer('test_queue', { messageRetryDelay: 10 });

    let callCount = 0;
    const mock = jest.fn((msg, cb) => {
        callCount += 1;
        if (callCount === 1) {
            throw new Error('Explicit error');
        } else if (callCount === 2) {
            cb();
        } else throw new Error('Unexpected call');
    });
    consumer.consume = mock;

    let delayedCount = 0;
    consumer.on('message.delayed', () => {
        delayedCount += 1;
    });

    let consumedCount = 0;
    consumer.on('message.consumed', () => {
        consumedCount += 1;
    });

    const producer = getProducer('test_queue');
    await producer.produceAsync({ hello: 'world' });
    consumer.run();

    await onMessageConsumed(consumer, () => {});

    await onConsumerIdle(consumer, () => {
        expect(delayedCount).toBe(1);
        expect(consumedCount).toBe(1);
    });
});
