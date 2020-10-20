const bluebird = require('bluebird');
const { getConsumer, getProducer, untilConsumerIdle, untilConsumerUp, untilConsumerEvent } = require('./common');
const { Message } = require('./../');
const events = require('../src/events');

test('A message is not lost in case of a consumer crash', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setBody({ hello: 'world' });

    await producer.produceMessageAsync(msg);

    /**
     * Consumer1 tries to consume a message but "crushes" (stops)
     */
    const consumer1 = getConsumer({
        consumeMock: jest.fn((msg, cb) => {
            // do not acknowledge/unacknowledge the message
            consumer1.shutdown();
        })
    });
    consumer1.on(events.DOWN, () => {
        // once stopped, start consumer2
        consumer2.run();
    });

    /**
     * Consumer2 re-queues failed message and consume it!
     */
    const consumer2 = getConsumer({
        consumeMock: jest.fn((msg, cb) => {
            cb();
        })
    });

    consumer1.run();

    await untilConsumerEvent(consumer2, events.GC_LOCK_ACQUIRED);
    await untilConsumerEvent(consumer2, events.GC_MESSAGE_REQUEUED);
    await untilConsumerEvent(consumer2, events.MESSAGE_ACKNOWLEDGED);
});
