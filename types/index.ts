import { KeyType, Pipeline, Redis, RedisOptions } from 'ioredis';
import { Callback, ClientOpts, Multi, RedisClient as NodeRedis } from 'redis';
import { Message } from '../src/system/app/message/message';
import { redisKeys } from '../src/system/common/redis-keys/redis-keys';
import { Worker } from '../src/system/common/worker/worker';
import { RedisClient } from '../src/system/common/redis-client/redis-client';
import { ServerOptions } from 'socket.io';
import * as Logger from 'bunyan';

///////////

export interface IORedisOptions {
  client: RedisClientName.IOREDIS;
  options?: RedisOptions;
}

export enum RedisClientName {
  REDIS = 'redis',
  IOREDIS = 'ioredis',
}

export interface INodeRedisOptions {
  client: RedisClientName.REDIS;
  options?: ClientOpts;
}

export type TRedisOptions = IORedisOptions | INodeRedisOptions;

export interface IMonitorConfig {
  enabled: boolean;
  port?: number;
  host?: string;
  socketOpts?: ServerOptions;
  basePath?: string;
}

export type TMessageDefaultOptions = {
  consumeTimeout: number;
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
};

export interface IStoreMessagesParams {
  queueSize?: number;
  expire?: number;
}

export interface IStoreMessagesConfig {
  acknowledged?: boolean | IStoreMessagesParams;
  deadLettered?: boolean | IStoreMessagesParams;
}

export interface IConfig {
  redis?: TRedisOptions;
  namespace?: string;
  logger?: {
    enabled: boolean;
    options?: Partial<Logger.LoggerOptions>;
  };
  monitor?: IMonitorConfig;
  message?: Partial<TMessageDefaultOptions>;
  storeMessages?: boolean | IStoreMessagesConfig;
}

///////////

export interface IRequiredStoreMessagesParams
  extends Required<IStoreMessagesParams> {
  store: boolean;
}

export interface IRequiredStoreMessagesConfig {
  acknowledged: IRequiredStoreMessagesParams;
  deadLettered: IRequiredStoreMessagesParams;
}

export interface IRequiredMonitorConfig extends IMonitorConfig {
  enabled: boolean;
  basePath: string;
}

export interface IRequiredConfig
  extends Required<Omit<IConfig, 'storeMessages'>> {
  message: TMessageDefaultOptions;
  storeMessages: IRequiredStoreMessagesConfig;
  monitor: IRequiredMonitorConfig;
}

///////////

declare module 'redis' {
  export interface Commands<R> {
    // Overwrite bad declaration from @types/redis
    info(cb?: Callback<string>): R;
    info(section?: string | string[], cb?: Callback<string>): R;
    INFO(cb?: Callback<string>): R;
    INFO(section?: string | string[], cb?: Callback<string>): R;

    // Add missing method
    lmove(
      source: string,
      destination: string,
      from: 'LEFT' | 'RIGHT',
      to: 'LEFT' | 'RIGHT',
      cb: ICallback<string>,
    ): void;
  }
}

declare module 'ioredis' {
  export interface Commands {
    // Add missing method
    lmove(
      source: string,
      destination: string,
      from: 'LEFT' | 'RIGHT',
      to: 'LEFT' | 'RIGHT',
      cb: ICallback<string>,
    ): void;
  }
}

export interface ICallback<T> {
  (err?: Error | null, reply?: T | null): void;
  (err: null | undefined, reply: T): void;
}

export type TUnaryFunction<T, E = void> = (reply: T) => E;

export type TFunction<TReturn = void, TArgs = any> = (
  ...args: TArgs[]
) => TReturn;

export type TMessageRateFields = Record<string, any>;

export interface IConsumerMessageRateFields extends TMessageRateFields {
  acknowledgedRate: number;
  deadLetteredRate: number;
}

export interface IProducerMessageRateFields extends TMessageRateFields {
  publishedRate: number;
  queuePublishedRate: Record<string, number>;
}

export type TCompatibleRedisClient = (NodeRedis | Redis) & {
  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void;
  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void;
  zrevrange(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void;
  subscribe(channel: string): void;
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    cb: ICallback<string[]>,
  ): void;
  zrangebyscore(
    key: KeyType,
    min: number | string,
    max: number | string,
    withScores: 'WITHSCORES',
    cb: ICallback<string[]>,
  ): void;
  smembers(key: string, cb: ICallback<string[]>): void;
  sadd(key: string, member: string, cb: ICallback<number>): void;
  hset(key: string, field: string, value: string, cb: ICallback<number>): void;
  hdel(key: string, fields: string | string[], cb: ICallback<number>): void;
  hmset(key: string, args: (string | number)[], cb: ICallback<string>): void;
  lpush(key: string, element: string, cb: ICallback<number>): void;
  rpush(key: string, element: string, cb: ICallback<number>): void;
  script(arg1: string, arg2: string, cb: ICallback<string>): void;
  eval: TFunction;
  evalsha: TFunction;
  watch(args: string[], cb: ICallback<string>): void;
  set(key: string, value: string, cb: ICallback<string>): void;
  set(key: string, value: string, flag: string, cb: ICallback<string>): void;
  set(
    key: string,
    value: string,
    mode: string,
    duration: number,
    cb: ICallback<string>,
  ): void;
  set(
    key: string,
    value: string,
    mode: string,
    duration: number,
    flag: string,
    cb: ICallback<string>,
  ): void;
  del(key: string | string[], cb: ICallback<number>): void;
  zrem(key: string, value: string | string[], cb: ICallback<number>): void;
  hmget(source: string, keys: string[], cb: ICallback<(string | null)[]>): void;
  exists(key: string, cb: ICallback<number>): void;
};

export type TRedisClientMulti = (Multi | Pipeline) & {
  hmset(key: string, args: (string | number)[]): void;
};

export type TWebsocketMainStreamPayload = {
  scheduledMessagesCount: number;
  queuesCount: number;
  deadLetteredMessagesCount: number;
  acknowledgedMessagesCount: number;
  pendingMessagesCount: number;
  pendingMessagesWithPriorityCount: number;
  consumersCount: number;
  queues: {
    [ns: string]: {
      [queueName: string]: TWebsocketMainStreamPayloadQueue;
    };
  };
};

export type TWebsocketMainStreamPayloadQueue = {
  ns: string;
  name: string;
  deadLetteredMessagesCount: number;
  acknowledgedMessagesCount: number;
  pendingMessagesCount: number;
  pendingMessagesWithPriorityCount: number;
  consumersCount: number;
};

export type TTimeSeriesRange = ITimeSeriesRangeItem[];

export interface ITimeSeriesRangeItem {
  timestamp: number;
  value: number;
}

export type TPaginatedResponse<T> = {
  total: number;
  items: T[];
};

export type TGetMessagesReply = TPaginatedResponse<{
  sequenceId: number;
  message: Message;
}>;

export type TGetScheduledMessagesReply = TPaginatedResponse<Message>;

export type TGetPendingMessagesWithPriorityReply = TPaginatedResponse<Message>;

export type TConsumerRedisKeys = ReturnType<
  typeof redisKeys['getConsumerKeys']
>;

export type TQueueConsumerRedisKeys = ReturnType<
  typeof redisKeys['getQueueConsumerKeys']
>;

export interface IQueueMetrics {
  acknowledged: number;
  deadLettered: number;
  pending: number;
  pendingWithPriority: number;
}

export enum EMessageDeadLetterCause {
  TTL_EXPIRED = 'ttl_expired',
  RETRY_THRESHOLD_EXCEEDED = 'retry_threshold_exceeded',
  PERIODIC_MESSAGE = 'periodic_message',
}

export enum EMessageUnacknowledgedCause {
  TIMEOUT = 'timeout',
  CAUGHT_ERROR = 'caught_error',
  UNACKNOWLEDGED = 'unacknowledged',
  RECOVERY = 'recovery',
  TTL_EXPIRED = 'ttl_expired',
}

export type TQueueParams = {
  name: string;
  ns: string;
};

export interface IPartialConsumerQueueParams {
  name: string;
  ns?: string;
  priorityQueuing?: boolean;
}

export type TConsumerQueueParams = Required<IPartialConsumerQueueParams>;

export type TQueueRateLimit = {
  limit: number;
  interval: number;
};

export type TWorkerParameters = {
  config: IRequiredConfig;
  timeout?: number;
};

export interface IConsumerWorkerParameters extends TWorkerParameters {
  consumerId: string;
}

export type TWorkerClassConstructor<T extends TWorkerParameters> = {
  new (redisClient: RedisClient, params: T, managed: boolean): Worker<T>;
};

export type THeartbeatRegistryPayload = {
  ipAddress: string[];
  hostname: string;
  pid: number;
  createdAt: number;
};

export type THeartbeatPayload = {
  timestamp: number;
  data: THeartbeatPayloadData;
};

export type THeartbeatPayloadData = {
  ram: { usage: NodeJS.MemoryUsage; free: number; total: number };
  cpu: { user: number; system: number; percentage: string };
};

export type TWebsocketHeartbeatOnlineIdsStreamPayload = {
  consumers: string[];
};

export type TConsumerMessageHandler = (
  msg: Message,
  cb: ICallback<void>,
) => void;

export type TConsumerMessageHandlerParams = {
  queue: TConsumerQueueParams;
  messageHandler: TConsumerMessageHandler;
};

export interface ICompatibleLogger {
  info(message: unknown, ...params: unknown[]): void;
  warn(message: unknown, ...params: unknown[]): void;
  error(message: unknown, ...params: unknown[]): void;
  debug(message: unknown, ...params: unknown[]): void;
}

export type TMessageJSON = {
  createdAt: number;
  queue: TQueueParams | null;
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
  consumeTimeout: number;
  body: unknown;
  priority: number | null;
  scheduledCron: string | null;
  scheduledDelay: number | null;
  scheduledRepeatPeriod: number | null;
  scheduledRepeat: number;
  metadata: TMessageMetadataJSON | null;
};

export type TMessageMetadataJSON = {
  uuid: string;
  publishedAt: number | null;
  scheduledAt: number | null;
  scheduledCronFired: boolean;
  attempts: number;
  scheduledRepeatCount: number;
  expired: boolean;
  nextScheduledDelay: number;
  nextRetryDelay: number;
};

export type TTimeSeriesParams = {
  key: string;
  expireAfterInSeconds?: number;
  retentionTimeInSeconds?: number;
  windowSizeInSeconds?: number;
};

export interface IHashTimeSeriesParams extends TTimeSeriesParams {
  indexKey: string;
}
