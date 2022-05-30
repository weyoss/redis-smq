import { promisifyAll } from 'bluebird';
import { events } from '../src/common/events/events';
import { Producer, Message, Consumer } from '../index';
import { config as testConfig } from './config';
import { IConfig, TConsumerMessageHandler, TQueueParams } from '../types';
import { QueueManager } from '../src/lib/queue-manager/queue-manager';
import { MessageManager } from '../src/lib/message-manager/message-manager';
import * as configuration from '../src/config/configuration';
import ScheduleWorker from '../src/workers/schedule.worker';
import {
  createClientInstance,
  errors,
  logger,
  RedisClient,
} from 'redis-smq-common';

export const config = configuration.getConfiguration(testConfig);

Message.setDefaultConsumeOptions({ retryDelay: 0 });

type TGetConsumerArgs = {
  queue?: string | TQueueParams;
  messageHandler?: TConsumerMessageHandler;
  cfg?: IConfig;
};

const QueueManagerAsync = promisifyAll(QueueManager);
const MessageManagerAsync = promisifyAll(MessageManager);

export const defaultQueue: TQueueParams = {
  name: 'test_queue',
  ns: config.namespace,
};
const redisClients: RedisClient[] = [];
const consumersList: Consumer[] = [];
const producersList: Producer[] = [];
let scheduleWorker: ScheduleWorker | null = null;
let messageManager: MessageManager | null = null;
let queueManager: QueueManager | null = null;

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
  logger.reset();
  logger.setLogger(console);
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

export function getConsumer(args: TGetConsumerArgs = {}) {
  const {
    queue = defaultQueue,
    messageHandler = (msg, cb) => cb(),
    cfg = config,
  } = args;
  const consumer = promisifyAll(new Consumer(cfg));
  consumer.consume(queue, messageHandler, () => void 0);
  consumersList.push(consumer);
  return consumer;
}

export function getProducer(cfg: IConfig = config) {
  const producer = new Producer(cfg);
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function getMessageManager(cfg: IConfig = config) {
  if (!messageManager) {
    messageManager = await MessageManagerAsync.createInstanceAsync(cfg);
  }
  return {
    deadLetteredMessages: promisifyAll(messageManager.deadLetteredMessages),
    acknowledgedMessages: promisifyAll(messageManager.acknowledgedMessages),
    pendingMessages: promisifyAll(messageManager.pendingMessages),
    scheduledMessages: promisifyAll(messageManager.scheduledMessages),
  };
}

export async function getQueueManager(cfg: IConfig = config) {
  if (!queueManager) {
    queueManager = await QueueManagerAsync.createInstanceAsync(cfg);
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
    scheduleWorker = new ScheduleWorker(redisClient, false);
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
  const c = promisifyAll(
    await new Promise<RedisClient>((resolve, reject) => {
      createClientInstance(config.redis, (err, client) => {
        if (err) reject(err);
        else if (!client) reject(new errors.EmptyCallbackReplyError());
        else resolve(client);
      });
    }),
  );
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
  cfg: IConfig = config,
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
  cfg: IConfig = config,
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
  cfg: IConfig = config,
) {
  const producer = getProducer(cfg);
  const message = new Message();
  message.setBody({ hello: 'world' }).setQueue(queue);
  await producer.produceAsync(message);
  return { producer, message, queue };
}

export async function produceMessageWithPriority(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = config,
) {
  const producer = promisifyAll(getProducer(cfg));
  const message = new Message();
  message.setPriority(Message.MessagePriority.LOW).setQueue(queue);
  await producer.produceAsync(message);
  return { message, producer, queue };
}

export async function scheduleMessage(
  queue: TQueueParams = defaultQueue,
  cfg: IConfig = config,
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
