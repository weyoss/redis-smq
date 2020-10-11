const { getConsumer, untilConsumerIdle } = require('./common');

test('A consumer is idle given no messages are produced', async () => {
    const consumer = getConsumer();
    const consume = jest.spyOn(consumer, 'consume');
    consumer.run();

    await untilConsumerIdle(consumer);
    expect(consume).toHaveBeenCalledTimes(0);
});
