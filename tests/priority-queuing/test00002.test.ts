import {
  defaultQueue,
  getConsumer,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from '../common';
import { promisifyAll } from 'bluebird';
import { Message } from '../../src/message';

test('Priority queuing: case 2', async () => {
  const consumedMessages: Message[] = [];

  const qm = await getQueueManager();
  await qm.queue.createAsync(defaultQueue, true);

  const consumer = promisifyAll(
    getConsumer({
      queue: defaultQueue,
      messageHandler: jest.fn((msg, cb) => {
        consumedMessages.push(msg);
        cb(null);
      }),
    }),
  );

  const producer = promisifyAll(getProducer());

  // message 1
  const msg1 = new Message();
  msg1.setBody({ testing: 'message with low priority' });
  msg1.setPriority(Message.MessagePriority.LOW);
  msg1.setQueue(defaultQueue);
  await producer.produceAsync(msg1);

  // message 2
  const msg2 = new Message();
  msg2.setBody({ testing: 'a message with very low priority' });
  msg2.setPriority(Message.MessagePriority.VERY_LOW);
  msg2.setQueue(defaultQueue);
  await producer.produceAsync(msg2);

  // message 3
  const msg3 = new Message();
  msg3.setBody({ testing: 'a message with above normal priority' });
  msg3.setPriority(Message.MessagePriority.ABOVE_NORMAL);
  msg3.setQueue(defaultQueue);
  await producer.produceAsync(msg3);

  // message 4
  const msg4 = new Message();
  msg4.setBody({ testing: 'a message with normal priority' });
  msg4.setPriority(Message.MessagePriority.NORMAL);
  msg4.setQueue(defaultQueue);
  await producer.produceAsync(msg4);

  // message 5
  const msg5 = new Message();
  msg5.setBody({ testing: 'a message with high priority' });
  msg5.setPriority(Message.MessagePriority.HIGH);
  msg5.setQueue(defaultQueue);
  await producer.produceAsync(msg5);

  await consumer.runAsync();
  await untilConsumerIdle(consumer);

  expect(consumedMessages.length).toBe(5);
  expect(consumedMessages[0].getRequiredId()).toBe(msg5.getRequiredId());
  expect(consumedMessages[1].getRequiredId()).toBe(msg3.getRequiredId());
  expect(consumedMessages[2].getRequiredId()).toBe(msg4.getRequiredId());
  expect(consumedMessages[3].getRequiredId()).toBe(msg1.getRequiredId());
  expect(consumedMessages[4].getRequiredId()).toBe(msg2.getRequiredId());
});
