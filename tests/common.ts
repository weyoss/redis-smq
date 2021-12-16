import { delay, promisifyAll } from 'bluebird';
import { events } from '../src/system/common/events';
import { RedisClient } from '../src/system/redis-client/redis-client';
import { Producer, Message, MonitorServer, Consumer } from '../index';
import { config } from './config';
import { ICallback, IConfig, TTimeSeriesRange } from '../types';
import { WebsocketMainStreamWorker } from '../src/monitor-server/workers/websocket-main-stream.worker';
import { QueueManagerFrontend } from '../src/system/queue-manager/queue-manager-frontend';
import { MessageManagerFrontend } from '../src/system/message-manager/message-manager-frontend';
import { MessageManager } from '../src/system/message-manager/message-manager';
import * as supertest from 'supertest';
import { Logger } from '../src/system/common/logger';
import { QueueManager } from '../src/system/queue-manager/queue-manager';
import { WebsocketRateStreamWorker } from '../src/monitor-server/workers/websocket-rate-stream.worker';

type TMonitorServer = ReturnType<typeof MonitorServer>;

type TGetConsumerArgs = {
  queueName?: string;
  cfg?: IConfig;
  consumeMock?: ((msg: Message, cb: ICallback<void>) => void) | null;
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

Message.setDefaultOptions(config.message);
const MessageManagerFrontendAsync = promisifyAll(MessageManagerFrontend);
const QueueManagerFrontendAsync = promisifyAll(QueueManagerFrontend);

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
let websocketMainStreamWorker: WebsocketMainStreamWorker | null = null;
let websocketRateStreamWorker: WebsocketRateStreamWorker | null = null;
let messageManager: MessageManager | null = null;
let messageManagerFrontend: MessageManagerFrontend | null = null;
let queueManager: QueueManager | null = null;
let queueManagerFrontend: QueueManagerFrontend | null = null;

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
  if (messageManagerFrontend) {
    const m = promisifyAll(messageManagerFrontend);
    await m.quitAsync();
    messageManagerFrontend = null;
  }
  if (queueManagerFrontend) {
    const q = promisifyAll(queueManagerFrontend);
    await q.quitAsync();
    queueManagerFrontend = null;
  }
  await stopMonitorServer();
  await stopWebsocketMainStreamWorker();
  await stopWebsocketRateStreamWorker();
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

export function getLogger() {
  return Logger('testsRunner', config.log);
}

export async function getMessageManager() {
  if (!messageManager) {
    const client = await getRedisInstance();
    const logger = getLogger();
    messageManager = new MessageManager(client, logger);
  }
  return messageManager;
}

export async function getMessageManagerFrontend() {
  if (!messageManagerFrontend) {
    messageManagerFrontend =
      await MessageManagerFrontendAsync.getSingletonInstanceAsync(config);
  }
  return messageManagerFrontend;
}

export async function getQueueManagerFrontend() {
  if (!queueManagerFrontend) {
    queueManagerFrontend =
      await QueueManagerFrontendAsync.getSingletonInstanceAsync(config);
  }
  return queueManagerFrontend;
}

export async function getQueueManager() {
  if (!queueManager) {
    const redisClient = await getRedisInstance();
    const logger = getLogger();
    queueManager = new QueueManager(redisClient, logger);
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
    monitorServer = null;
  }
}

export async function startWebsocketMainStreamWorker(): Promise<void> {
  const redisClient = await getRedisInstance();
  const queueManager = await getQueueManager();
  const messageManager = await getMessageManager();
  const logger = getLogger();
  websocketMainStreamWorker = new WebsocketMainStreamWorker(
    queueManager,
    messageManager,
    redisClient,
    logger,
  );
}

export async function stopWebsocketMainStreamWorker(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (websocketMainStreamWorker) {
      websocketMainStreamWorker.quit(() => {
        websocketMainStreamWorker = null;
        resolve();
      });
    } else resolve();
  });
}

export async function startWebsocketRateStreamWorker(): Promise<void> {
  const redisClient = await getRedisInstance();
  const logger = getLogger();
  websocketRateStreamWorker = new WebsocketRateStreamWorker(
    redisClient,
    logger,
  );
}

export async function stopWebsocketRateStreamWorker(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (websocketRateStreamWorker) {
      websocketRateStreamWorker.quit(() => {
        websocketRateStreamWorker = null;
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

export async function produceAndAcknowledgeMessage() {
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb();
    }),
  });

  const message = new Message();
  message.setBody({ hello: 'world' });
  await producer.produceMessageAsync(message);

  consumer.run();
  await untilConsumerIdle(consumer);
  return { producer, consumer, message };
}

export async function produceAndDeadLetterMessage() {
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  const message = new Message();
  message.setBody({ hello: 'world' });
  await producer.produceMessageAsync(message);

  consumer.run();
  await untilConsumerIdle(consumer);
  return { producer, consumer, message };
}

export async function produceMessage() {
  const producer = getProducer();
  const message = new Message();
  message.setBody({ hello: 'world' });
  await producer.produceMessageAsync(message);
  return { producer, message };
}

export async function produceMessageWithPriority() {
  const cfg = {
    ...config,
    priorityQueue: true,
  };
  const queueName = 'test_queue';
  const producer = promisifyAll(getProducer(queueName, cfg));

  const message = new Message();
  message.setPriority(Message.MessagePriority.LOW);
  await producer.produceMessageAsync(message);
  return { message, producer };
}

export async function produceScheduledMessage() {
  const producer = promisifyAll(getProducer());
  const message = new Message();
  message.setScheduledDelay(10000);
  await producer.produceMessageAsync(message);
  return { message, producer };
}

export async function listenForWebsocketStreamEvents(streamName: string) {
  await startWebsocketRateStreamWorker();
  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe(streamName);
  const data: { ts: number; timeSeries: TTimeSeriesRange }[] = [];
  subscribeClient.on('message', (channel, message) => {
    if (typeof message === 'string') {
      const json: TTimeSeriesRange = JSON.parse(message);
      data.push({ ts: Math.ceil(Date.now() / 1000), timeSeries: json });
    } else throw new Error('Expected a message payload');
  });
  for (; true; ) {
    if (data.length === 5) break;
    else await delay(500);
  }
  return data;
}
