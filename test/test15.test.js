const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    onConsumerIdle,
    onConsumerUp,
    onMessageConsumed,
    validateTime,
} = require('./common');
const { Message } = require('../');


test('A consumer delays a failed message before re-queuing it again, given messageRetryThreshold is not exceeded', async () => {
    const consumer = getConsumer('test_queue', { messageRetryDelay: 10, messageRetryThreshold: 5 });
    const timestamps = [];
    let callCount = 0;
    const mock = jest.fn((msg, cb) => {
        timestamps.push(Date.now());
        callCount += 1;
        if (callCount < 5) {
            throw new Error('Explicit error');
        } else if (callCount === 5) {
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

    const msg = new Message();
    msg.setBody({ hello: 'world' });

    const producer = getProducer('test_queue');
    await producer.produceMessageAsync(msg);
    consumer.run();

    await onMessageConsumed(consumer, () => {});

    await onConsumerIdle(consumer, () => {
        expect(delayedCount).toBe(4);
        expect(consumedCount).toBe(1);
    });

    for (let i = 0; i < timestamps.length; i += 1) {
        const diff = timestamps[i] - timestamps[0];
        if (i === 0) {
            expect(validateTime(diff, 0)).toBe(true);
        } else if (i === 1) {
            expect(validateTime(diff, 10000)).toBe(true);
        } else if (i === 2) {
            expect(validateTime(diff, 20000)).toBe(true);
        } else if (i === 3) {
            expect(validateTime(diff, 30000)).toBe(true);
        } else {
            expect(validateTime(diff, 40000)).toBe(true);
        }
    }
});
