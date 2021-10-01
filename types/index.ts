import { ServerOptions } from 'socket.io';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { ClientOpts, Multi, RedisClient as NodeRedis } from 'redis';
import * as Logger from 'bunyan';
import { RedisClient } from '../src/redis-client';
import { Message } from '../src/message';

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

export type TCompatibleRedisClient = NodeRedis | Redis;

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
}

export interface IConsumerConstructorOptions {
  messageConsumeTimeout?: number;
  messageTTL?: number;
  messageRetryThreshold?: number;
  messageRetryDelay?: number;
}

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
