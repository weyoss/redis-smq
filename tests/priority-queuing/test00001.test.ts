import { getConsumer, getProducer, untilConsumerIdle } from '../common';
import { promisifyAll } from 'bluebird';
import { config } from '../config';
import { Message } from '../../src/message';

describe('Priority queue: check that messages are consumed with respect to their priority', () => {
  test('Case 1', async () => {
    const cfg = {
      ...config,
      priorityQueue: true,
    };
    const queueName = 'test_queue';
    const consumer = promisifyAll(
      getConsumer({
        queueName,
        cfg,
      }),
    );

    await consumer.runAsync();
    await untilConsumerIdle(consumer);
  });

  test('Case 2', async () => {
    const cfg = {
      ...config,
      priorityQueue: true,
    };
    const queueName = 'test_queue';
    const consumedMessages: Message[] = [];
    const consumer = promisifyAll(
      getConsumer({
        queueName,
        cfg,
        consumeMock: jest.fn((msg, cb) => {
          consumedMessages.push(msg);
          cb(null);
        }),
      }),
    );

    const producer = promisifyAll(getProducer(queueName, cfg));

    // message 1
    const msg1 = new Message();
    msg1.setBody({ testing: 'message with low priority' });
    msg1.setPriority(Message.MessagePriority.LOW);
    await producer.produceMessageAsync(msg1);

    // message 2
    const msg2 = new Message();
    msg2.setBody({ testing: 'a message with very low priority' });
    msg2.setPriority(Message.MessagePriority.VERY_LOW);
    await producer.produceMessageAsync(msg2);

    // message 3
    const msg3 = new Message();
    msg3.setBody({ testing: 'a message with above normal priority' });
    msg3.setPriority(Message.MessagePriority.ABOVE_NORMAL);
    await producer.produceMessageAsync(msg3);

    // message 4
    const msg4 = new Message();
    msg4.setBody({ testing: 'a message with normal priority' });
    msg4.setPriority(Message.MessagePriority.NORMAL);
    await producer.produceMessageAsync(msg4);

    // message 5
    const msg5 = new Message();
    msg5.setBody({ testing: 'a message with high priority' });
    msg5.setPriority(Message.MessagePriority.HIGH);
    await producer.produceMessageAsync(msg5);

    await consumer.runAsync();
    await untilConsumerIdle(consumer);

    expect(consumedMessages.length).toBe(5);
    expect(consumedMessages[0].getId()).toBe(msg5.getId());
    expect(consumedMessages[1].getId()).toBe(msg3.getId());
    expect(consumedMessages[2].getId()).toBe(msg4.getId());
    expect(consumedMessages[3].getId()).toBe(msg1.getId());
    expect(consumedMessages[4].getId()).toBe(msg2.getId());
  });
});
