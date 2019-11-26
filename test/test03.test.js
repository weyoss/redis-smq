const { getConsumer, getProducer, onConsumerIdle } = require('./common');

test('Produce and consume 100 messages', async () => {
    const producer = getProducer();
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');
    consumer.run();

    for (let i = 0; i < 100; i += 1) {
        await producer.produceAsync({ hello: 'world' });
    }

    await onConsumerIdle(consumer, () => {
        expect(consume).toHaveBeenCalledTimes(100);
        expect(consume.mock.calls[0][0]).toStrictEqual({ hello: 'world' });
    });
});
