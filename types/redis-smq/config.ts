import { ILoggerConfig, IRedisConfig } from 'redis-smq-common';
import { IMessagesConfig, IMessagesConfigStorageRequired } from '../message';
import {
  IEventListenersConfig,
  IEventListenersConfigRequired,
} from '../event-listener';

export interface IRedisSMQConfig {
  redis?: IRedisConfig;
  namespace?: string;
  logger?: ILoggerConfig;
  messages?: IMessagesConfig;
  eventListeners?: IEventListenersConfig;
}

export interface IRedisSMQConfigRequired extends Required<IRedisSMQConfig> {
  messages: {
    store: IMessagesConfigStorageRequired;
  };
  eventListeners: IEventListenersConfigRequired;
}
