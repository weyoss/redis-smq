const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    untilConsumerIdle,
    untilConsumerUp,
    untilMessageAcknowledged,
    validateTime
} = require('./common');
const { Message } = require('../index');

test('Produce and consume a delayed message', async () => {
    const consumer = getConsumer({
        consumeMock: jest.fn((msg, cb) => {
            cb();
        })
    });
    consumer.run();

    const msg = new Message();
    msg.setScheduledDelay(10).setBody({ hello: 'world' }); // seconds

    const producer = getProducer();

    let producedAt = null;
    producer.once('message.produced', () => {
        producedAt = Date.now();
    });

    await producer.produceMessageAsync(msg);

    await untilMessageAcknowledged(consumer);
    const consumedAt = Date.now();

    await untilConsumerIdle(consumer);

    const diff = consumedAt - producedAt;
    expect(validateTime(diff, 10000)).toBe(true);
});
