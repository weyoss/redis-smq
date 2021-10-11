import { ServerOptions } from 'socket.io';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { ClientOpts, Multi, RedisClient as NodeRedis } from 'redis';
import * as Logger from 'bunyan';
import { RedisClient } from '../src/redis-client';
import { Message } from '../src/message';
import { redisKeys } from '../src/redis-keys';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
} from '../src/broker';

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

export interface IStatsProvider<T = unknown> {
  tick(): T;
  publish(redisClient: RedisClient, stats: T): void;
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
};

export type TRedisClientMulti = Multi | IORedis.Pipeline;

export interface IRedisOptions {
  client: RedisClientName;
  options?: RedisOptions | ClientOpts;
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
}

export type TConsumerOptions = {
  messageConsumeTimeout: number;
  messageTTL: number;
  messageRetryThreshold: number;
  messageRetryDelay: number;
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

export type TGetScheduledMessagesReply = {
  total: number;
  items: Message[];
};

export type TInstanceRedisKeys = ReturnType<
  typeof redisKeys['getInstanceKeys']
>;

export enum EQueueMetadataType {
  PENDING_MESSAGES = 'pending',
  SCHEDULED_MESSAGES = 'scheduled',
  DEAD_LETTER_MESSAGES = 'dead_letter',
  UNACKNOWLEDGED_MESSAGES = 'errored',
  ACKNOWLEDGED_MESSAGES = 'acknowledged',
}

export enum EMessageMetadataType {
  ENQUEUED = 'enqueued_at',
  SCHEDULED = 'scheduled_at',
  SCHEDULED_DELETED = 'scheduled_deleted_at',
  SCHEDULED_ENQUEUED = 'scheduled_delivered_at',
  ACKNOWLEDGED = 'acknowledged_at',
  UNACKNOWLEDGED = 'unacknowledged_at',
  DEAD_LETTER = 'dead_letter_at',
}

export type TMessageMetadata = {
  type: EMessageMetadataType;
  timestamp: number;
  deadLetterCause?: EMessageDeadLetterCause;
  unacknowledgedCause?: EMessageUnacknowledgementCause;
  delayed?: boolean;
};

export type TQueueMetadata = {
  pending: number;
  scheduled: number;
  deadLetter: number;
  unacknowledged: number;
  acknowledged: number;
};
