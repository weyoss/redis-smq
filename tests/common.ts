import { promisifyAll } from 'bluebird';
import { events } from '../src/common/events/events';
import { RedisClient } from '../src/common/redis-client/redis-client';
import { Producer, Message, Consumer, setLogger } from '../index';
import { config as testConfig } from './config';
import { IConfig, TConsumerMessageHandler, TQueueParams } from '../types';
import { QueueManager } from '../src/lib/queue-manager/queue-manager';
import { MessageManager } from '../src/lib/message-manager/message-manager';
import * as supertest from 'supertest';
import * as configuration from '../src/config/configuration';
import ScheduleWorker from '../src/workers/schedule.worker';
import { merge } from 'lodash';
import { reset } from '../src/common/logger/logger';
import Store from '../src/config/messages/store';

export const config = configuration.setConfiguration(testConfig);

type TGetConsumerArgs = {
  queue?: string | TQueueParams;
  messageHandler?: TConsumerMessageHandler;
};

export interface ISuperTestResponse<TData> extends supertest.Response {
  body: {
    data?: TData;
    error?: {
      code: string;
      message: string;
      details: Record<string, any>;
    };
  };
}

const QueueManagerAsync = promisifyAll(QueueManager);
const MessageManagerAsync = promisifyAll(MessageManager);

export const defaultQueue: TQueueParams = {
  name: 'test_queue',
  ns: config.namespace,
};
const redisClients: RedisClient[] = [];
const consumersList: Consumer[] = [];
const producersList: Producer[] = [];
const getConfigurationOrig = configuration.getConfiguration;
let scheduleWorker: ScheduleWorker | null = null;
let messageManager: MessageManager | null = null;
let queueManager: QueueManager | null = null;

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
  restoreConfiguration();
  reset();
  setLogger(console);
}

export async function shutdown(): Promise<void> {
  const p = async (list: (Consumer | Producer)[]) => {
    for (const i of list) {
      if (i.isGoingUp()) {
        await new Promise((resolve) => {
          i.once(events.UP, resolve);
        });
      }
      if (i.isRunning()) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          i.shutdown(resolve);
        });
      }
    }
  };

  await p(consumersList);
  await p(producersList);

  await stopScheduleWorker();

  if (messageManager) {
    await promisifyAll(messageManager).quitAsync();
    messageManager = null;
  }
  if (queueManager) {
    const q = promisifyAll(queueManager);
    await q.quitAsync();
    queueManager = null;
  }

  // Redis clients should be stopped in the last step, to avoid random errors from different
  // dependant components.
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      await promisifyAll(redisClient).haltAsync();
    }
  }
}

export function restoreConfiguration(): void {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  configuration.getConfiguration = getConfigurationOrig;
}

export function mockConfiguration(config: IConfig): void {
  const store = config.messages?.store !== undefined ? Store(config) : {};
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  configuration.getConfiguration = () => {
    return merge({}, getConfigurationOrig(), config, {
      messages: {
        store,
      },
    });
  };
}

export function getConsumer(args: TGetConsumerArgs = {}) {
  const { queue = defaultQueue, messageHandler = (msg, cb) => cb() } = args;
  const consumer = promisifyAll(new Consumer());
  consumer.consume(queue, messageHandler, () => void 0);
  consumersList.push(consumer);
  return consumer;
}

export function getProducer() {
  const producer = new Producer();
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function getMessageManager() {
  if (!messageManager) {
    messageManager = await MessageManagerAsync.getSingletonInstanceAsync();
  }
  return {
    deadLetteredMessages: promisifyAll(messageManager.deadLetteredMessages),
    acknowledgedMessages: promisifyAll(messageManager.acknowledgedMessages),
    pendingMessages: promisifyAll(messageManager.pendingMessages),
    scheduledMessages: promisifyAll(messageManager.scheduledMessages),
  };
}

export async function getQueueManager() {
  if (!queueManager) {
    queueManager = await QueueManagerAsync.getSingletonInstanceAsync();
  }
  const queue = promisifyAll(queueManager.queue);
  const namespace = promisifyAll(queueManager.namespace);
  const queueRateLimit = promisifyAll(queueManager.queueRateLimit);
  const queueMetrics = promisifyAll(queueManager.queueMetrics);
  return {
    queue,
    namespace,
    queueRateLimit,
    queueMetrics,
  };
}

export async function startScheduleWorker(): Promise<void> {
  if (!scheduleWorker) {
    const redisClient = await getRedisInstance();
    scheduleWorker = new ScheduleWorker(
      redisClient,
      {
        timeout: 1000,
        config,
        consumerId: 'abc',
      },
      false,
    );
    scheduleWorker.run();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (scheduleWorker) {
      scheduleWorker.quit(() => {
        scheduleWorker = null;
        resolve();
      });
    } else resolve();
  });
}

export function validateTime(
  actualTime: number,
  expectedTime: number,
  driftTolerance = 3000,
): boolean {
  return (
    actualTime >= expectedTime - driftTolerance &&
    actualTime <= expectedTime + driftTolerance
  );
}

export async function getRedisInstance() {
  const RedisClientAsync = promisifyAll(RedisClient);
  const c = promisifyAll(await RedisClientAsync.getNewInstanceAsync());
  redisClients.push(c);
  return c;
}

export async function consumerOnEvent<T extends Array<any>>(
  consumer: Consumer,
  event: string,
) {
  return new Promise<T>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    consumer.once(event, (...args: T) => {
      resolve(args);
    });
  });
}

export async function untilMessageAcknowledged(
  consumer: Consumer,
  msg?: Message,
): Promise<void> {
  const [message] = await consumerOnEvent<[Message]>(
    consumer,
    events.MESSAGE_ACKNOWLEDGED,
  );
  if (msg && msg.getRequiredId() !== message.getRequiredId()) {
    await untilMessageAcknowledged(consumer, msg);
  }
}

export async function untilConsumerEvent(
  consumer: Consumer,
  event: string,
): Promise<unknown[]> {
  return consumerOnEvent(consumer, event);
}

export async function produceAndAcknowledgeMessage(
  queue: TQueueParams = defaultQueue,
) {
  const producer = getProducer();
  const consumer = getConsumer({
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
) {
  const producer = getProducer();
  const consumer = getConsumer({
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

export async function produceMessage(queue: TQueueParams = defaultQueue) {
  const producer = getProducer();
  const message = new Message();
  message.setBody({ hello: 'world' }).setQueue(queue);
  await producer.produceAsync(message);
  return { producer, message, queue };
}

export async function produceMessageWithPriority(
  queue: TQueueParams = defaultQueue,
) {
  const producer = promisifyAll(getProducer());
  const message = new Message();
  message.setPriority(Message.MessagePriority.LOW).setQueue(queue);
  await producer.produceAsync(message);
  return { message, producer, queue };
}

export async function scheduleMessage(queue: TQueueParams = defaultQueue) {
  const producer = promisifyAll(getProducer());
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
