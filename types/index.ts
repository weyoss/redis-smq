import { ServerOptions } from 'socket.io';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { ClientOpts, Multi, RedisClient as NodeRedis } from 'redis';
import * as Logger from 'bunyan';
import { RedisClient } from '../src/system/redis-client/redis-client';
import { Message } from '../src/message';
import { redisKeys } from '../src/system/redis-keys';

export interface ICallback<T> {
  (err?: Error | null, reply?: T | null): void;
  (err: null | undefined, reply: T): void;
}

export type TUnaryFunction<T, E = void> = (reply: T) => E;

export type TFunction<TReturn = void, TArgs = any> = (
  ...args: TArgs[]
) => TReturn;

export interface IConsumerStats {
  acknowledgedRate: number;
  unacknowledgedRate: number;
  processingRate: number;
  isIdle: boolean;
}

export interface IProducerStats {
  inputRate: number;
}

export interface IStatsProvider<T = Record<string, any>> {
  getStats(): T;
  format(stats: Record<string, any>): string[];
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
  subscribe(channel: string): void;
  zrangebyscore(
    key: string,
    min: number,
    max: number,
    cb: ICallback<string[]>,
  ): void;
  smembers(key: string, cb: ICallback<string[]>): void;
  sadd(key: string, member: string, cb: ICallback<number>): void;
  hset(key: string, field: string, value: string, cb: ICallback<number>): void;
  hdel(key: string, fields: string | string[], cb: ICallback<number>): void;
  hmset(key: string, args: string[], cb: ICallback<string>): void;
  lpush(key: string, element: string, cb: ICallback<number>): void;
  script(arg1: string, arg2: string, cb: ICallback<string>): void;
  eval: TFunction;
  evalsha: TFunction;
  watch(args: string[], cb: ICallback<string>): void;
};

export type TRedisClientMulti = Multi | IORedis.Pipeline;

export type IRedisOptions = IORedisOptions | INodeRedisOptions;

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
  redis?: IRedisOptions;
  namespace?: string;
  log?: {
    enabled?: boolean;
    options?: Partial<Logger.LoggerOptions>;
  };
  monitor?: IMonitorConfig;
  priorityQueue?: boolean;
  message?: Partial<TMessageDefaultOptions>;
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
  erroredMessages: number;
  size: number;
  producers?: {
    [producerId: string]: TAggregatedStatsQueueProducer;
  };
  consumers?: {
    [consumerId: string]: TAggregatedStatsQueueConsumer;
  };
};

export type TAggregatedStats = {
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

export type TPaginatedRedisQuery<T> = {
  total: number;
  items: T[];
};

export type TPaginatedRedisQueryTotalItemsFn = (
  redisClient: RedisClient,
  cb: ICallback<number>,
) => void;

export type TPaginatedRedisQueryTransformFn<T> = (data: string) => T;

export type TGetScheduledMessagesReply = TPaginatedRedisQuery<Message>;

export type TGetAcknowledgedMessagesReply = TPaginatedRedisQuery<Message>;

export type TGetDeadLetterMessagesReply = TPaginatedRedisQuery<Message>;

export type TGetPendingMessagesReply = TPaginatedRedisQuery<Message>;

export type TInstanceRedisKeys = ReturnType<
  typeof redisKeys['getInstanceKeys']
>;

export enum EQueueMetadata {
  PENDING_MESSAGES = 'pending',
  PENDING_MESSAGES_WITH_PRIORITY = 'pending_with_priority',
  SCHEDULED_MESSAGES = 'scheduled',
  DEAD_LETTER_MESSAGES = 'dead_letter',
  ACKNOWLEDGED_MESSAGES = 'acknowledged',
}

export enum EMessageMetadata {
  ENQUEUED = 'enqueued',
  ENQUEUED_WITH_PRIORITY = 'enqueued_with_priority',
  SCHEDULED = 'scheduled',
  ACKNOWLEDGED = 'acknowledged',
  UNACKNOWLEDGED = 'unacknowledged',
  DEAD_LETTER = 'dead_letter',
  DELETED_FROM_DL = 'deleted_from_dl',
  DELETED_FROM_QUEUE = 'deleted_from_queue',
  DELETED_FROM_PRIORITY_QUEUE = 'deleted_from_priority_queue',
  DELETED_FROM_ACKNOWLEDGED_QUEUE = 'deleted_from_acknowledged_queue',
  DELETED_FROM_SCHEDULED_QUEUE = 'deleted_from_scheduled_queue',
}

export interface IMessageMetadata {
  state: Message;
  type: EMessageMetadata;
  timestamp: number;
  deadLetterCause?: EMessageDeadLetterCause;
  unacknowledgedCause?: EMessageUnacknowledgedCause;
}

export type TQueueMetadata = {
  pending: number;
  pendingWithPriority: number;
  scheduled: number;
  deadLetter: number;
  acknowledged: number;
};

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
