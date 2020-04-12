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


describe('Produce and consume a delayed message with scheduledCRON/scheduledRepeat/scheduledPeriod parameters', () => {
    test('Case 1', async () => {
        const consumer = getConsumer();
        const timestamps = [];
        const mock = jest.fn((msg, cb) => {
            timestamps.push(Date.now());
            cb();
        });
        consumer.consume = mock;
        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/3 * * * * *')
            .setBody({ hello: 'world' });

        const producer = getProducer();
        await producer.produceMessageAsync(msg);

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        for (let i = 0; i < timestamps.length; i += 1) {
            const diff = timestamps[i] - timestamps[0];
            if (i === 0) {
                expect(validateTime(diff, 0)).toBe(true);
            } else if (i === 1) {
                expect(validateTime(diff, 3000)).toBe(true);
            } else if (i === 2) {
                expect(validateTime(diff, 6000)).toBe(true);
            } else if (i === 3) {
                expect(validateTime(diff, 9000)).toBe(true);
            } else {
                expect(validateTime(diff, 12000)).toBe(true);
            }
        }
    });

    test('Case 2', async () => {
        const consumer = getConsumer();
        const timestamps = [];
        const mock = jest.fn((msg, cb) => {
            timestamps.push(Date.now());
            cb();
        });
        consumer.consume = mock;
        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/6 * * * * *')
            .setBody({ hello: 'world' });

        const producer = getProducer();
        await producer.produceMessageAsync(msg);

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        for (let i = 0; i < timestamps.length; i += 1) {
            const diff = timestamps[i] - timestamps[0];
            if (i === 0) {
                expect(validateTime(diff, 0)).toBe(true);
            } else if (i === 1) {
                expect(validateTime(diff, 6000)).toBe(true);
            } else if (i === 2) {
                expect(validateTime(diff, 12000)).toBe(true);
            } else if (i === 3) {
                expect(validateTime(diff, 18000)).toBe(true);
            } else {
                expect(validateTime(diff, 24000)).toBe(true);
            }
        }
    });

    test('Case 3', async () => {
        const consumer = getConsumer();
        const timestamps = [];
        const mock = jest.fn((msg, cb) => {
            timestamps.push(Date.now());
            cb();
        });
        consumer.consume = mock;
        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/20 * * * * *')
            .setScheduledRepeat(3)
            .setScheduledPeriod(3)
            .setScheduledDelay(10) // is ignored
            .setBody({ hello: 'world' });

        const producer = getProducer();
        await producer.produceMessageAsync(msg);

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        for (let i = 0; i < timestamps.length; i += 1) {
            const diff = timestamps[i] - timestamps[0];
            if (i === 0) {
                expect(validateTime(diff, 0)).toBe(true);
            } else if (i === 1) {
                expect(validateTime(diff, 3000)).toBe(true);
            } else if (i === 2) {
                expect(validateTime(diff, 6000)).toBe(true);
            } else if (i === 3) {
                expect(validateTime(diff, 20000)).toBe(true);
            } else if (i === 4) {
                expect(validateTime(diff, 23000)).toBe(true);
            } else if (i === 5) {
                expect(validateTime(diff, 26000)).toBe(true);
            } else if (i === 6) {
                expect(validateTime(diff, 40000)).toBe(true);
            } else if (i === 7) {
                expect(validateTime(diff, 43000)).toBe(true);
            } else if (i === 8) {
                expect(validateTime(diff, 46000)).toBe(true);
            }
        }
    });

    test('Case 4', async () => {
        const consumer = getConsumer();
        const timestamps = [];
        const mock = jest.fn((msg, cb) => {
            timestamps.push(Date.now());
            cb();
        });
        consumer.consume = mock;
        consumer.run();

        const msg = new Message();
        msg
            .setScheduledCron('*/20 * * * * *')
            .setScheduledRepeat(0)
            .setScheduledPeriod(3)
            .setScheduledDelay(10) // is ignored
            .setBody({ hello: 'world' });

        const producer = getProducer();
        await producer.produceMessageAsync(msg);

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        await onMessageConsumed(consumer, () => {});

        for (let i = 0; i < timestamps.length; i += 1) {
            const diff = timestamps[i] - timestamps[0];
            if (i === 0) {
                expect(validateTime(diff, 0)).toBe(true);
            } else if (i === 1) {
                expect(validateTime(diff, 20000)).toBe(true);
            } else if (i === 2) {
                expect(validateTime(diff, 40000)).toBe(true);
            } else if (i === 3) {
                expect(validateTime(diff, 60000)).toBe(true);
            } else {
                expect(validateTime(diff, 80000)).toBe(true);
            }
        }
    });
});
