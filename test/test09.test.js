const bluebird = require('bluebird');
const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../');

test('A consumer does re-queue a failed message when threshold is not exceeded, otherwise it moves the message to DLQ (dead letter queue)', async () => {
    const producer = getProducer();
    const consumer = getConsumer();

    const mock = jest.fn((msg, cb) => {
        throw new Error('Explicit error');
    });
    consumer.consume = mock;

    let reQueuedCount = 0;
    consumer.on('message.requeued', () => {
        reQueuedCount += 1;
    });

    let deadCount = 0;
    consumer.on('message.moved_to_dlq', () => {
        deadCount += 1;
    });

    const msg = new Message();
    msg.setBody({ hello: 'world' });

    await producer.produceMessageAsync(msg);
    consumer.run();

    await onConsumerIdle(consumer, () => {
        expect(reQueuedCount).toBe(2);
        expect(deadCount).toBe(1);
    });
});
