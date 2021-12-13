import { ServerOptions } from 'socket.io';
import IORedis, { KeyType, Redis, RedisOptions } from 'ioredis';
import { Callback, ClientOpts, Multi, RedisClient as NodeRedis } from 'redis';
import * as Logger from 'bunyan';
import { Message } from '../src/system/message';
import { redisKeys } from '../src/system/common/redis-keys/redis-keys';

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

export interface IConsumerMessageRateFields extends Record<string, number> {
  acknowledgedRate: number;
  unacknowledgedRate: number;
  processingRate: number;
}

export interface IProducerMessageRateFields extends Record<string, number> {
  inputRate: number;
}

export enum RedisClientName {
  REDIS = 'redis',
  IOREDIS = 'ioredis',
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
  zrevrangebyscore(
    key: KeyType,
    max: number,
    min: number,
    withScores: 'WITHSCORES',
    cb: ICallback<string[]>,
  ): void;
  subscribe(channel: string): void;
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
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
  del(key: string, cb: ICallback<number>): void;
  zrem(key: string, value: string | string[], cb: ICallback<number>): void;
  hmget(source: string, keys: string[], cb: ICallback<string[]>): void;
};

export type TRedisClientMulti = (Multi | IORedis.Pipeline) & {
  hmset(key: string, args: (string | number)[]): void;
};

export type TRedisOptions = IORedisOptions | INodeRedisOptions;

export interface IORedisOptions {
  client: RedisClientName.IOREDIS;
  options?: RedisOptions;
}

export interface INodeRedisOptions {
  client: RedisClientName.REDIS;
  options?: ClientOpts;
}

export interface IMonitorConfig {
  enabled?: boolean;
  port?: number;
  host?: string;
  socketOpts?: ServerOptions;
}

export interface IConfig {
  redis?: TRedisOptions;
  namespace?: string;
  log?: {
    enabled?: boolean;
    options?: Partial<Logger.LoggerOptions>;
  };
  monitor?: IMonitorConfig;
  priorityQueue?: boolean;
  message?: Partial<TMessageDefaultOptions>;
}

export interface IMonitorServer {
  listen: () => Promise<void>;
  quit: () => Promise<void>;
}

export type TMessageDefaultOptions = {
  consumeTimeout: number;
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
};

export type TAggregatedStatsQueueProducer = {
  id: string;
  namespace: string;
  queueName: string;
  rates: {
    input: number;
  };
};

export type TAggregatedStatsQueueConsumer = {
  id: string;
  namespace: string;
  queueName: string;
  resources?: Record<string, any>;
  rates?: {
    processing: number;
    acknowledged: number;
    unacknowledged: number;
  };
};

export type TAggregatedStatsQueue = {
  queueName: string;
  namespace: string;
  deadLetteredMessages: number;
  acknowledgedMessages: number;
  pendingMessages: number;
  pendingMessagesWithPriority: number;
  producers?: {
    [producerId: string]: TAggregatedStatsQueueProducer;
  };
  consumers?: {
    [consumerId: string]: TAggregatedStatsQueueConsumer;
  };
};

export type TAggregatedStats = {
  scheduledMessages: number;
  rates: {
    processing: number;
    acknowledged: number;
    unacknowledged: number;
    input: number;
  };
  queues: {
    [ns: string]: {
      [queueName: string]: TAggregatedStatsQueue;
    };
  };
};

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

export type TProducerRedisKeys = ReturnType<
  typeof redisKeys['getProducerKeys']
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

export type TMessageQueue = {
  name: string;
  ns: string;
};

export type TConsumerWorkerParameters = {
  config: IConfig;
  consumerId: string;
};
