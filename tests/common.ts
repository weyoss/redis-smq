import { promisifyAll } from 'bluebird';
import { events } from '../src/system/common/events';
import { RedisClient } from '../src/system/redis-client/redis-client';
import { Producer, Message, MonitorServer, Consumer } from '../index';
import { config } from './config';
import { ICallback, IConfig } from '../types';
import { StatsWorker } from '../src/monitor-server/workers/stats.worker';
import { QueueManager } from '../src/queue-manager';
import { MessageManager } from '../src/message-manager';

type TMonitorServer = ReturnType<typeof MonitorServer>;
type TGetConsumerArgs = {
  queueName?: string;
  cfg?: IConfig;
  consumeMock?: ((msg: Message, cb: ICallback<void>) => void) | null;
};

Message.setDefaultOptions(config.message);

const MessageManagerAsync = promisifyAll(MessageManager);
const QueueManagerAsync = promisifyAll(QueueManager);

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
let statsWorker: StatsWorker | null = null;
let messageManager: MessageManager | null = null;
let queueManager: QueueManager | null = null;

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
    const m = promisifyAll(messageManager);
    await m.quitAsync();
    messageManager = null;
  }
  if (queueManager) {
    const q = promisifyAll(queueManager);
    await q.quitAsync();
    queueManager = null;
  }
  await stopMonitorServer();
  await stopStatsAggregator();
}

export function getConsumer(args: TGetConsumerArgs = {}) {
  const { queueName = 'test_queue', cfg = config, consumeMock = null } = args;
  const consumer = new TestConsumer(queueName, cfg);
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
    messageManager = await MessageManagerAsync.getSingletonInstanceAsync(
      config,
    );
  }
  return messageManager;
}

export async function getQueueManager() {
  if (!queueManager) {
    queueManager = await QueueManagerAsync.getSingletonInstanceAsync(config);
  }
  return queueManager;
}

export async function startMonitorServer(): Promise<void> {
  monitorServer = MonitorServer(config);
  await monitorServer.listen();
}

export async function stopMonitorServer(): Promise<void> {
  if (monitorServer) {
    await monitorServer.quit();
  }
}

export async function startStatsWorker(): Promise<void> {
  const redisClient = await getRedisInstance();
  statsWorker = new StatsWorker(redisClient, config);
}

export async function stopStatsAggregator(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (statsWorker) {
      statsWorker.quit(() => {
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
  const RedisClientAsync = promisifyAll(RedisClient);
  const c = promisifyAll(await RedisClientAsync.getNewInstanceAsync(config));
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
