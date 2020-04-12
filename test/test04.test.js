const bluebird = require('bluebird');
const { getConsumer, getProducer, onConsumerIdle } = require('./common');
const { Message } = require('../');


test('Produce a message having messageTTL and sure the message is not consumed and destroyed when messageTTL exceeds', async () => {
    const producer = getProducer();
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');

    let messageDestroyed = 0;
    consumer.on('message.destroyed', () => {
        messageDestroyed += 1;
    });

    const msg = new Message();
    msg.setBody({ hello: 'world' }).setTTL(3000);

    await producer.produceMessageAsync(msg);
    await bluebird.delay(5000);
    consumer.run();

    await onConsumerIdle(consumer, () => {
        expect(consume).toHaveBeenCalledTimes(0);
        expect(messageDestroyed).toBe(1);
    });
});
