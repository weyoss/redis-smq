const { getConsumer, getProducer, onConsumerIdle } = require('./common');

test('Produce and consume 1 message', async () => {
    const producer = getProducer();
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');

    await producer.produceAsync({ hello: 'world' });
    consumer.run();

    await onConsumerIdle(consumer, () => {
        expect(consume.mock.calls[0][0]).toStrictEqual({ hello: 'world' });
        expect(consume).toHaveBeenCalledTimes(1);
    });
});
