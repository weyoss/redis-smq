const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../index');


test('Produce and consume 100 messages', async () => {
    const producer = getProducer();
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');
    consumer.run();

    for (let i = 0; i < 100; i += 1) {
        const msg = new Message();
        msg.setBody({ hello: 'world' });
        await producer.produceMessageAsync(msg);
    }

    await onConsumerIdle(consumer, () => {
        expect(consume).toHaveBeenCalledTimes(100);
        expect(consume.mock.calls[0][0]).toStrictEqual({ hello: 'world' });
    });
});
