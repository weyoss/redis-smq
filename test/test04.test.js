const bluebird = require('bluebird');
const { getConsumer, getProducer, onConsumerIdle } = require('./common');

test('Produce a message having messageTTL and sure the message is not consumed and destroyed when messageTTL exceeds', async () => {
    const producer = getProducer();
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');

    let messageDestroyed = 0;
    consumer.on('message.destroyed', () => {
        messageDestroyed += 1;
    });

    await producer.produceWithTTLAsync({ hello: 'world' }, 3000);
    await bluebird.delay(5000);
    consumer.run();

    await onConsumerIdle(consumer, () => {
        expect(consume).toHaveBeenCalledTimes(0);
        expect(messageDestroyed).toBe(1);
    });
});
