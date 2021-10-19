import { promisifyAll } from 'bluebird';
import { events } from '../src/system/events';
import { RedisClient } from '../src/system/redis-client';
import { Producer, Consumer, Message, MonitorServer } from '../index';
import { config } from './config';
import { ICallback, IConfig, TConsumerOptions } from '../types';
import { StatsAggregatorThread } from '../src/monitor-server/threads/stats-aggregator.thread';
import { QueueManager } from '../src/system/queue-manager';
import { MessageManager } from '../src/message-manager';
import { Scheduler } from '../src/system/scheduler';

type TMonitorServer = ReturnType<typeof MonitorServer>;

class TestConsumer extends Consumer {
  // eslint-disable-next-line class-methods-use-this
  consume(message: Message, cb: ICallback<void>) {
    cb(null);
  }
}

const redisClients: RedisClient[] = [];
const consumersList: Consumer[] = [];
const producersList: Producer[] = [];
let monitorServer: TMonitorServer | null = null;
let statsAggregator: StatsAggregatorThread | null = null;
let messageManager: MessageManager | null = null;
let queueManager: QueueManager | null = null;
let scheduler: Scheduler | null = null;

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
}

export async function shutdown(): Promise<void> {
  const p = async (list: (Consumer | Producer)[]) => {
    for (const i of list) {
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
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      redisClient.end(true);
    }
  }
  if (messageManager) {
    messageManager = null;
  }
  if (queueManager) {
    queueManager = null;
  }
  if (scheduler) {
    scheduler = null;
  }
  await stopMonitorServer();
  await stopStatsAggregator();
}

export function getConsumer({
  queueName = 'test_queue',
  cfg = config,
  options = {},
  consumeMock = null,
}: {
  queueName?: string;
  cfg?: IConfig;
  options?: Partial<TConsumerOptions>;
  consumeMock?: ((msg: Message, cb: ICallback<void>) => void) | null;
} = {}) {
  const consumer = new TestConsumer(queueName, cfg, {
    messageRetryDelay: 0,
    ...options,
  });
  if (consumeMock) {
    consumer.consume = consumeMock;
  }
  const c = promisifyAll(consumer);
  consumersList.push(c);
  return c;
}

export function getProducer(queueName = 'test_queue', cfg = config) {
  const producer = new Producer(queueName, cfg);
  const p = promisifyAll(producer);
  producersList.push(p);
  return p;
}

export async function getMessageManager() {
  if (!messageManager) {
    const client = await getRedisInstance();
    messageManager = new MessageManager(client);
  }
  return messageManager;
}

export async function getQueueManager() {
  if (!queueManager) {
    const client = await getRedisInstance();
    queueManager = new QueueManager(client);
  }
  return queueManager;
}

export async function getScheduler(queueName: string) {
  if (!scheduler) {
    const client = await getRedisInstance();
    scheduler = new Scheduler(queueName, client);
  }
  return scheduler;
}

export async function startMonitorServer(): Promise<void> {
  await new Promise<void>((resolve) => {
    monitorServer = MonitorServer(config);
    monitorServer.listen(() => {
      resolve();
    });
  });
}

export async function stopMonitorServer(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (monitorServer) {
      monitorServer.quit(() => {
        monitorServer = null;
        resolve();
      });
    } else resolve();
  });
}

export async function startStatsAggregator(): Promise<void> {
  const redisClient = await getRedisInstance();
  statsAggregator = new StatsAggregatorThread(redisClient, config);
}

export async function stopStatsAggregator(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (statsAggregator) {
      statsAggregator.quit(() => {
        monitorServer = null;
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
    await new Promise<RedisClient>((resolve) =>
      RedisClient.getNewInstance(config, resolve),
    ),
  );
  redisClients.push(c);
  return c;
}

export async function consumerOnEvent(
  consumer: Consumer,
  event: string,
): Promise<void> {
  return new Promise<void>((resolve) => {
    consumer.once(event, () => {
      resolve();
    });
  });
}

export async function untilConsumerIdle(consumer: Consumer): Promise<void> {
  return consumerOnEvent(consumer, events.IDLE);
}

export async function untilMessageAcknowledged(
  consumer: Consumer,
): Promise<void> {
  return consumerOnEvent(consumer, events.MESSAGE_ACKNOWLEDGED);
}

export async function untilConsumerEvent(
  consumer: Consumer,
  event: string,
): Promise<void> {
  return consumerOnEvent(consumer, event);
}
