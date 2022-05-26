import { Message } from '../src/lib/message/message';
import { redisKeys } from '../src/common/redis-keys/redis-keys';
import { Consumer } from '../src/lib/consumer/consumer';
import { Producer } from '../src/lib/producer/producer';
import {
  ICallback,
  TLoggerConfig,
  TRedisConfig,
} from 'redis-smq-common/dist/types';
import { RedisClient } from 'redis-smq-common';

///////////

export interface IMessagesConfig {
  store?: boolean | IMessagesConfigStore;
}

export interface IMessagesConfigStoreOptions {
  queueSize?: number;
  expire?: number;
}

export interface IMessagesConfigStore {
  acknowledged?: boolean | IMessagesConfigStoreOptions;
  deadLettered?: boolean | IMessagesConfigStoreOptions;
}

export interface IConfig {
  redis?: TRedisConfig;
  namespace?: string;
  logger?: TLoggerConfig;
  messages?: IMessagesConfig;
}

///////////

export interface IRequiredStoreMessagesParams
  extends Required<IMessagesConfigStoreOptions> {
  store: boolean;
}

export interface IRequiredMessagesConfigStore {
  acknowledged: IRequiredStoreMessagesParams;
  deadLettered: IRequiredStoreMessagesParams;
}

export interface IRequiredConfig extends Required<IConfig> {
  messages: {
    store: IRequiredMessagesConfigStore;
  };
}

///////////

export type TPaginatedResponse<T> = {
  total: number;
  items: T[];
};

export type TGetMessagesReply = TPaginatedResponse<{
  sequenceId: number;
  message: Message;
}>;

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

export type TQueueRateLimit = {
  limit: number;
  interval: number;
};

export type TQueueSettings = {
  priorityQueuing: boolean;
  rateLimit?: TQueueRateLimit | null;
};

export type TConsumerInfo = {
  ipAddress: string[];
  hostname: string;
  pid: number;
  createdAt: number;
};

export type TConsumerHeartbeat = {
  timestamp: number;
  data: TConsumerHeartbeatPayload;
};

export type TConsumerHeartbeatPayload = {
  ram: { usage: NodeJS.MemoryUsage; free: number; total: number };
  cpu: { user: number; system: number; percentage: string };
};

export type TConsumerMessageHandler = (
  msg: Message,
  cb: ICallback<void>,
) => void;

export type TConsumerMessageHandlerParams = {
  queue: TQueueParams;
  messageHandler: TConsumerMessageHandler;
};

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

///

export interface IPlugin {
  quit(cb: ICallback<void>): void;
}

export type TConsumerPluginConstructor = new (
  redisClient: RedisClient,
  queue: TQueueParams,
  consumer: Consumer,
) => IPlugin;

export type TProducerPluginConstructor = new (
  redisClient: RedisClient,
  producer: Producer,
) => IPlugin;

///

export type TMessageConsumeOptions = {
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
  consumeTimeout: number;
};
