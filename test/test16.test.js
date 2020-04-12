const bluebird = require('bluebird');
const {
    getConsumer,
    getProducer,
    onConsumerIdle,
    onConsumerUp,
    onMessageConsumed,
    validateTime,
} = require('./common');
const { Message } = require('../');


test('Given many queues, a message is not lost and re-queued to its origin queue in case of a consumer crash or a failure', async () => {
    /**
     *
     */
    const queueAConsumer1 = getConsumer('queue_a');
    const queueAMeta = {
        receivedMessages: [],
        requeued: 0,
        consumed: 0,
    };
    const mock1 = jest.fn((msg, cb) => {
        // do not acknowledge/unacknowledge the message
        queueAMeta.receivedMessages.push(msg);
        queueAConsumer1.shutdown();
    });
    queueAConsumer1.consume = mock1;
    queueAConsumer1.run();

    /**
     *
     */
    queueAConsumer1.on('down', () => {
        // once stopped, start another consumer
        queueAConsumer2.run();
    });

    /**
     *
     */
    const queueAConsumer2 = getConsumer('queue_a');
    const mock2 = jest.fn((msg, cb) => {
        queueAMeta.receivedMessages.push(msg);
        cb();
    });
    queueAConsumer2.consume = mock2;
    queueAConsumer2
        .on('message.requeued', () => {
            queueAMeta.requeued += 1;
        })
        .on('message.consumed', () => {
            queueAMeta.consumed += 1;
        });

    /**
     *
     */
    const queueBConsumer1 = getConsumer('queue_b');
    const queueBMeta = {
        receivedMessages: [],
        requeued: 0,
        consumed: 0,
    };
    const mock3 = jest.fn((msg, cb) => {
        queueBMeta.receivedMessages.push(msg);
        cb();
    });
    queueBConsumer1.consume = mock3;
    queueBConsumer1
        .on('message.requeued', () => {
            queueBMeta.requeued += 1;
        })
        .on('message.consumed', () => {
            queueBMeta.consumed += 1;
        });
    queueBConsumer1.run();

    /**
     * Produce a message to QUEUE A
     */
    const msg = new Message();
    msg.setBody({ id: 'a', hello: 'world' });

    const queueAProducer = getProducer('queue_a');
    await queueAProducer.produceMessageAsync(msg);

    /**
     * Produce a message to QUEUE B
     */
    const anotherMsg = new Message();
    anotherMsg.setBody({ id: 'b', hello: 'world' });

    const queueBProducer = getProducer('queue_b');
    await queueBProducer.produceMessageAsync(anotherMsg);

    /**
     * Wait 10s
     */
    await bluebird.delay(10000);

    /**
     *  Wait until consumers are idle
     */
    await onConsumerIdle(queueAConsumer2, () => {});
    await onConsumerIdle(queueBConsumer1, () => {});

    /**
     * Check
     */
    expect(queueAMeta.requeued).toBe(1);
    expect(queueAMeta.consumed).toBe(1);
    expect(queueBMeta.requeued).toBe(0);
    expect(queueBMeta.consumed).toBe(1);
    expect(queueAMeta.receivedMessages.length).toBe(2);
    expect(queueAMeta.receivedMessages[0].id).toBe('a');
    expect(queueAMeta.receivedMessages[1].id).toBe('a');
    expect(queueBMeta.receivedMessages.length).toBe(1);
    expect(queueBMeta.receivedMessages[0].id).toBe('b');
});
