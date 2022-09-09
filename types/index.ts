import { Message } from '../src/lib/message/message';
import { redisKeys } from '../src/common/redis-keys/redis-keys';
import {
  ICallback,
  TLoggerConfig,
  TRedisConfig,
} from 'redis-smq-common/dist/types';
import { EventEmitter } from 'events';
import { DirectExchange } from '../src/lib/exchange/direct-exchange';
import { TopicExchange } from '../src/lib/exchange/topic-exchange';
import { FanOutExchange } from '../src/lib/exchange/fan-out-exchange';

///

export type TEventListenerInitArgs = {
  eventProvider: EventEmitter;
  config: IRequiredConfig;
  instanceId: string;
};

export interface IEventListener {
  init(args: TEventListenerInitArgs, cb: ICallback<void>): void;
  quit(cb: ICallback<void>): void;
}

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

export interface IEventListenersConfig {
  consumerEventListeners?: (new () => IEventListener)[];
  producerEventListeners?: (new () => IEventListener)[];
}

export interface IConfig {
  redis?: TRedisConfig;
  namespace?: string;
  logger?: TLoggerConfig;
  messages?: IMessagesConfig;
  eventListeners?: IEventListenersConfig;
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

export type TRequiredEventListenersConfig = Required<IEventListenersConfig>;

export interface IRequiredConfig extends Required<IConfig> {
  messages: {
    store: IRequiredMessagesConfigStore;
  };
  eventListeners: TRequiredEventListenersConfig;
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
  CONSUME_ERROR = 'consumer_error',
  UNACKNOWLEDGED = 'unacknowledged',
  OFFLINE_CONSUMER = 'offline_consumer',
  TTL_EXPIRED = 'ttl_expired',
}

export type TTopicParams = {
  topic: string;
  ns: string;
};

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
  exchange?: FanOutExchange;
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
  queue: TQueueParams | string | null;
  exchange: Record<string, any> | null;
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
  messageState: TMessageState | null;
};

export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

export type TExchange = DirectExchange | TopicExchange | FanOutExchange;

export interface IExchangeParams<
  TBindingParams,
  TBindingType extends EExchangeType,
> {
  exchangeTag: string;
  destinationQueue: TQueueParams | null;
  bindingParams: TBindingParams;
  type: TBindingType;
}

export type IDirectExchangeParams = IExchangeParams<
  TQueueParams | string,
  EExchangeType.DIRECT
>;

export type IFanOutExchangeParams = IExchangeParams<
  string,
  EExchangeType.FANOUT
>;

export type ITopicExchangeParams = IExchangeParams<
  TTopicParams | string,
  EExchangeType.TOPIC
>;

export type TMessageState = {
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

export type TMessageConsumeOptions = {
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
  consumeTimeout: number;
};

///

export type TProduceMessageReply = {
  messages: Message[];
  scheduled: boolean;
};
