const bluebird = require('bluebird');
const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../index');


test('A consumer does re-queue and consume again a failed message when threshold not exceeded', async () => {
    const producer = getProducer();
    const consumer = getConsumer();

    let callCount = 0;
    const mock = jest.fn((msg, cb) => {
        callCount += 1;
        if (callCount === 1) throw new Error('Explicit error');
        else if (callCount === 2) cb();
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

    await bluebird.delay(10000);

    await onConsumerIdle(consumer, () => {
        expect(queuedCount).toBe(1);
        expect(consumedCount).toBe(1);
    });
});
