const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    onConsumerIdle,
    onConsumerUp,
    onMessageConsumed,
    validateTime,
} = require('./common');
const { Message } = require('../index');


describe('Produce and consume a delayed message with scheduledRepeat and scheduledPeriod parameters', () => {
    test('Case 1', async () => {
        const consumer = getConsumer();
        let producedAt = null;
        let callCount = 0;
        const mock = jest.fn((msg, cb) => {
            callCount += 1;
            if (callCount > 3) throw new Error('Unexpected call');
            cb();
        });
        consumer.consume = mock;
        consumer.run();

        const msg = new Message();
        msg
            .setScheduledDelay(10)
            .setScheduledRepeat(3)
            .setScheduledPeriod(3)
            .setBody({ hello: 'world' });

        const producer = getProducer();
        producer.once('message.produced', () => {
            producedAt = Date.now();
        });
        await producer.produceMessageAsync(msg);

        await onMessageConsumed(consumer, () => {
            const diff = Date.now() - producedAt;
            expect(validateTime(diff, 10000)).toBe(true);
        });
        await onMessageConsumed(consumer, () => {
            const diff = Date.now() - producedAt;
            expect(validateTime(diff, 13000)).toBe(true);
        });
        await onMessageConsumed(consumer, () => {
            const diff = Date.now() - producedAt;
            expect(validateTime(diff, 16000)).toBe(true);
        });

        await onConsumerIdle(consumer, () => {});
    });

    test('Case 2', async () => {
        const consumer = getConsumer();
        let producedAt = null;
        let callCount = 0;
        const mock = jest.fn((msg, cb) => {
            callCount += 1;
            if (callCount > 1) throw new Error('Unexpected call');
            cb();
        });
        consumer.consume = mock;
        consumer.run();

        const msg = new Message();
        msg
            .setScheduledDelay(10)
            .setScheduledRepeat(0) // should not be repeated
            .setScheduledPeriod(3)
            .setBody({ hello: 'world' });

        const producer = getProducer();
        producer.once('message.produced', () => {
            producedAt = Date.now();
        });
        await producer.produceMessageAsync(msg);

        await onMessageConsumed(consumer, () => {
            const diff = Date.now() - producedAt;
            expect(validateTime(diff, 10000)).toBe(true);
        });

        await onConsumerIdle(consumer, () => {});
    });
});
