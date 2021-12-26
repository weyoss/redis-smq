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
import { WebsocketHeartbeatStreamWorker } from '../src/monitor-server/workers/websocket-heartbeat-stream.worker';
import { WebsocketOnlineStreamWorker } from '../src/monitor-server/workers/websocket-online-stream.worker';
import { TimeSeriesResponseBodyDTO } from '../src/monitor-server/controllers/common/time-series/time-series-response.DTO';

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
let websocketHeartbeatStreamWorker: WebsocketHeartbeatStreamWorker | null =
  null;
let websocketOnlineStreamWorker: WebsocketOnlineStreamWorker | null = null;
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

  await stopMonitorServer();
  await stopWebsocketMainStreamWorker();
  await stopWebsocketRateStreamWorker();
  await stopWebsocketHeartbeatStreamWorker();
  await stopWebsocketOnlineStreamWorker();

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
  if (!monitorServer) {
    monitorServer = MonitorServer(config);
    await monitorServer.listen();
  }
}

export async function stopMonitorServer(): Promise<void> {
  if (monitorServer) {
    await monitorServer.quit();
    monitorServer = null;
  }
}

export async function startWebsocketMainStreamWorker(): Promise<void> {
  if (!websocketMainStreamWorker) {
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
  if (!websocketRateStreamWorker) {
    const redisClient = await getRedisInstance();
    const logger = getLogger();
    websocketRateStreamWorker = new WebsocketRateStreamWorker(
      redisClient,
      logger,
    );
  }
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

export async function startWebsocketHeartbeatStreamWorker(): Promise<void> {
  if (!websocketHeartbeatStreamWorker) {
    const redisClient = await getRedisInstance();
    const logger = getLogger();
    websocketHeartbeatStreamWorker = new WebsocketHeartbeatStreamWorker(
      redisClient,
      logger,
    );
  }
}

export async function stopWebsocketHeartbeatStreamWorker(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (websocketHeartbeatStreamWorker) {
      websocketHeartbeatStreamWorker.quit(() => {
        websocketHeartbeatStreamWorker = null;
        resolve();
      });
    } else resolve();
  });
}

export async function startWebsocketOnlineStreamWorker(): Promise<void> {
  if (!websocketOnlineStreamWorker) {
    const redisClient = await getRedisInstance();
    const logger = getLogger();
    const queueManager = await getQueueManager();
    websocketOnlineStreamWorker = new WebsocketOnlineStreamWorker(
      redisClient,
      queueManager,
      logger,
    );
  }
}

export async function stopWebsocketOnlineStreamWorker(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (websocketOnlineStreamWorker) {
      websocketOnlineStreamWorker.quit(() => {
        websocketOnlineStreamWorker = null;
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

export async function listenForWebsocketStreamEvents<
  TPayload = TTimeSeriesRange,
>(
  streamName: string,
  startFn: () => Promise<void> = startWebsocketRateStreamWorker,
) {
  await startFn();
  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe(streamName);
  const data: { ts: number; payload: TPayload }[] = [];
  subscribeClient.on('message', (channel, message) => {
    const payload: TPayload = JSON.parse(message);
    data.push({ ts: Date.now(), payload });
  });
  for (; true; ) {
    if (data.length === 5) {
      subscribeClient.unsubscribe(streamName);
      break;
    } else await delay(500);
  }
  return data;
}

export async function validateTimeSeriesFrom(url: string) {
  await startMonitorServer();
  const request = supertest('http://127.0.0.1:3000');
  const timestamp = Math.ceil(Date.now() / 1000);
  const from = timestamp - 60;
  const response1: ISuperTestResponse<TimeSeriesResponseBodyDTO['data']> =
    await request.get(`${url}?from=${from}&to=${timestamp}`);
  expect(response1.statusCode).toBe(200);
  const data = response1.body.data ?? [];
  expect(data.length).toEqual(60);
  expect(data[0]).toEqual({
    timestamp: from,
    value: 0,
  });
  expect(data[59]).toEqual({
    timestamp: timestamp - 1,
    value: 0,
  });
}
