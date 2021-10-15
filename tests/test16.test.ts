import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { delay } from 'bluebird';
import { ICallback } from '../types';
import { events } from '../src/system/events';

type TQueueMetadata = {
  receivedMessages: Message[];
  requeued: number;
  consumed: number;
};

test('Given many queues, a message is not lost and re-queued to its origin queue in case of a consumer crash or a failure', async () => {
  const queueAMeta: TQueueMetadata = {
    receivedMessages: [],
    requeued: 0,
    consumed: 0,
  };
  const queueAConsumer1 = getConsumer({
    queueName: 'queue_a',
    consumeMock: jest.fn((msg: Message, cb: ICallback<void>) => {
      // do not acknowledge/unacknowledge the message
      queueAMeta.receivedMessages.push(msg);
      queueAConsumer1.shutdown();
    }),
  });
  queueAConsumer1.run();

  queueAConsumer1.on(events.DOWN, () => {
    // once stopped, start another consumer
    queueAConsumer2.run();
  });

  const queueAConsumer2 = getConsumer({
    queueName: 'queue_a',
    consumeMock: jest.fn((msg: Message, cb: ICallback<void>) => {
      queueAMeta.receivedMessages.push(msg);
      cb(null);
    }),
  });
  queueAConsumer2
    .on(events.MESSAGE_RETRY, () => {
      queueAMeta.requeued += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      queueAMeta.consumed += 1;
    });

  const queueBMeta: TQueueMetadata = {
    receivedMessages: [],
    requeued: 0,
    consumed: 0,
  };
  const queueBConsumer1 = getConsumer({
    queueName: 'queue_b',
    consumeMock: jest.fn((msg: Message, cb: ICallback<void>) => {
      queueBMeta.receivedMessages.push(msg);
      cb(null);
    }),
  });
  queueBConsumer1
    .on(events.MESSAGE_RETRY, () => {
      queueBMeta.requeued += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      queueBMeta.consumed += 1;
    });
  queueBConsumer1.run();

  /**
   * Produce a message to QUEUE A
   */
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const queueAProducer = getProducer('queue_a');
  await queueAProducer.produceMessageAsync(msg);

  /**
   * Produce a message to QUEUE B
   */
  const anotherMsg = new Message();
  anotherMsg.setBody({ id: 'b' });

  const queueBProducer = getProducer('queue_b');
  await queueBProducer.produceMessageAsync(anotherMsg);

  /**
   * Wait 10s
   */
  await delay(10000);

  /**
   *  Wait until consumers are idle
   */
  await untilConsumerIdle(queueAConsumer2);
  await untilConsumerIdle(queueBConsumer1);

  /**
   * Check
   */
  expect(queueAMeta.requeued).toBe(1);
  expect(queueAMeta.consumed).toBe(1);
  expect(queueBMeta.requeued).toBe(0);
  expect(queueBMeta.consumed).toBe(1);
  expect(queueAMeta.receivedMessages.length).toBe(2);
  expect(queueAMeta.receivedMessages[0].getId()).toBe(msg.getId());
  expect(queueAMeta.receivedMessages[1].getId()).toBe(msg.getId());
  expect(queueBMeta.receivedMessages.length).toBe(1);
  expect(queueBMeta.receivedMessages[0].getId()).toBe(anotherMsg.getId());
});
