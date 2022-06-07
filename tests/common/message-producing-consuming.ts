import { IConfig, TQueueParams } from '../../types';
import { Message } from '../../src/lib/message/message';
import { events } from '../../src/common/events/events';
import { promisifyAll } from 'bluebird';
import { untilConsumerEvent, untilMessageAcknowledged } from './events';
import { getConsumer } from './consumer';
import { getProducer } from './producer';
import { getQueueManager } from './queue-manager';
import { requiredConfig } from './config';
import { fork } from 'child_process';
import * as path from 'path';

export const defaultQueue: TQueueParams = {
  name: 'test_queue',
  ns: requiredConfig.namespace,
};

export async function produceAndAcknowledgeMessage(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = requiredConfig,
) {
  const producer = getProducer(cfg);
  const consumer = getConsumer({
    cfg,
    queue,
    messageHandler: jest.fn((msg, cb) => {
      cb();
    }),
  });

  const message = new Message();
  message.setBody({ hello: 'world' }).setQueue(queue);
  await producer.produceAsync(message);

  consumer.run();
  await untilMessageAcknowledged(consumer);
  return { producer, consumer, queue, message };
}

export async function produceAndDeadLetterMessage(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = requiredConfig,
) {
  const producer = getProducer(cfg);
  const consumer = getConsumer({
    cfg,
    queue,
    messageHandler: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  const message = new Message();
  message.setBody({ hello: 'world' }).setQueue(queue);
  await producer.produceAsync(message);

  consumer.run();
  await untilConsumerEvent(consumer, events.MESSAGE_DEAD_LETTERED);
  return { producer, consumer, message, queue };
}

export async function produceMessage(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = requiredConfig,
) {
  const producer = getProducer(cfg);
  const message = new Message();
  message.setBody({ hello: 'world' }).setQueue(queue);
  await producer.produceAsync(message);
  return { producer, message, queue };
}

export async function produceMessageWithPriority(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = requiredConfig,
) {
  const producer = promisifyAll(getProducer(cfg));
  const message = new Message();
  message.setPriority(Message.MessagePriority.LOW).setQueue(queue);
  await producer.produceAsync(message);
  return { message, producer, queue };
}

export async function scheduleMessage(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = requiredConfig,
) {
  const producer = promisifyAll(getProducer(cfg));
  const message = new Message();
  message.setScheduledDelay(10000).setQueue(queue);
  await producer.produceAsync(message);
  return { message, producer, queue };
}

export async function createQueue(
  queue: string | TQueueParams,
  priorityQueuing: boolean,
) {
  const qm = await getQueueManager();
  await qm.queue.createAsync(queue, priorityQueuing);
}

export async function crashAConsumerConsumingAMessage() {
  await new Promise((resolve) => {
    const thread = fork(path.join(__dirname, 'consumer-thread.js'));
    thread.on('error', () => void 0);
    thread.on('exit', resolve);
  });
}
