const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../index');


test('Produce and consume 1 message', async () => {
    const producer = getProducer();
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');

    const msg = new Message();
    msg.setBody({ hello: 'world' });

    await producer.produceMessageAsync(msg);
    consumer.run();

    await onConsumerIdle(consumer, () => {
        expect(consume.mock.calls[0][0]).toStrictEqual({ hello: 'world' });
        expect(consume).toHaveBeenCalledTimes(1);
    });
});
