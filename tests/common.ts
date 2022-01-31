import { delay, promisifyAll } from 'bluebird';
import { events } from '../src/system/common/events';
import { RedisClient } from '../src/system/common/redis-client/redis-client';
import {
  Producer,
  Message,
  MonitorServer,
  Consumer,
  setLogger,
} from '../index';
import { config as testConfig } from './config';
import {
  IConfig,
  TConsumerMessageHandler,
  TQueueParams,
  TTimeSeriesRange,
} from '../types';
import { WebsocketMainStreamWorker } from '../src/monitor-server/workers/websocket-main-stream.worker';
import { QueueManagerFrontend } from '../src/system/queue-manager/queue-manager-frontend';
import { MessageManager } from '../src/system/message-manager/message-manager';
import * as supertest from 'supertest';
import { WebsocketRateStreamWorker } from '../src/monitor-server/workers/websocket-rate-stream.worker';
import { WebsocketHeartbeatStreamWorker } from '../src/monitor-server/workers/websocket-heartbeat-stream.worker';
import { WebsocketOnlineStreamWorker } from '../src/monitor-server/workers/websocket-online-stream.worker';
import { TimeSeriesResponseBodyDTO } from '../src/monitor-server/controllers/common/dto/time-series/time-series-response.DTO';
import * as configuration from '../src/system/common/configuration';

export const config = configuration.setConfiguration(testConfig);

setLogger(console);

type TGetConsumerArgs = {
  queue?: string | TQueueParams;
  enablePriorityQueuing?: boolean;
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

const QueueManagerFrontendAsync = promisifyAll(QueueManagerFrontend);

export const defaultQueue: TQueueParams = {
  name: 'test_queue',
  ns: config.namespace,
};
const redisClients: RedisClient[] = [];
const consumersList: Consumer[] = [];
const producersList: Producer[] = [];
const getConfigurationOrig = configuration.getConfiguration;
let monitorServer: MonitorServer | null = null;
let websocketMainStreamWorker: WebsocketMainStreamWorker | null = null;
let websocketRateStreamWorker: WebsocketRateStreamWorker | null = null;
let websocketHeartbeatStreamWorker: WebsocketHeartbeatStreamWorker | null =
  null;
let websocketOnlineStreamWorker: WebsocketOnlineStreamWorker | null = null;
let messageManager: MessageManager | null = null;
let queueManagerFrontend: QueueManagerFrontend | null = null;

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
  restoreConfiguration();
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
  if (queueManagerFrontend) {
    const q = promisifyAll(queueManagerFrontend);
    await q.quitAsync();
    queueManagerFrontend = null;
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  configuration.getConfiguration = () => {
    return {
      ...getConfigurationOrig(),
      ...config,
    };
  };
}

export function getConsumer(args: TGetConsumerArgs = {}) {
  const {
    queue = defaultQueue,
    messageHandler = (msg, cb) => cb(),
    enablePriorityQueuing = false,
  } = args;
  const consumer = promisifyAll(new Consumer());
  consumer.consume(queue, enablePriorityQueuing, messageHandler, () => void 0);
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
    const client = await getRedisInstance();
    messageManager = new MessageManager(client);
  }
  return messageManager;
}

export async function getQueueManagerFrontend() {
  if (!queueManagerFrontend) {
    queueManagerFrontend =
      await QueueManagerFrontendAsync.getSingletonInstanceAsync();
  }
  return queueManagerFrontend;
}

export async function startMonitorServer(): Promise<void> {
  if (!monitorServer) {
    monitorServer = new MonitorServer();
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
    websocketMainStreamWorker = new WebsocketMainStreamWorker(
      redisClient,
      {
        timeout: 1000,
        config,
      },
      false,
    );
    websocketMainStreamWorker.run();
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
    websocketRateStreamWorker = new WebsocketRateStreamWorker(
      redisClient,
      {
        timeout: 1000,
        config,
      },
      false,
    );
    websocketRateStreamWorker.run();
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
    websocketHeartbeatStreamWorker = new WebsocketHeartbeatStreamWorker(
      redisClient,
      {
        timeout: 1000,
        config,
      },
      false,
    );
    websocketHeartbeatStreamWorker.run();
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
    websocketOnlineStreamWorker = new WebsocketOnlineStreamWorker(
      redisClient,
      {
        timeout: 1000,
        config,
      },
      false,
    );
    websocketOnlineStreamWorker.run();
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

export async function untilConsumerIdle(
  consumer: Consumer,
  queueParams?: TQueueParams,
): Promise<void> {
  const [queue] = await consumerOnEvent<[TQueueParams]>(consumer, events.IDLE);
  if (
    queueParams &&
    !(queueParams.name === queue.name && queueParams.ns === queue.ns)
  ) {
    await untilConsumerIdle(consumer, queueParams);
  }
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
    if (data.length === 10) {
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
