import {
  IRedisSMQConfig,
  IMessagesConfigStorageOptions,
  IMessagesConfigStorageRequired,
  IMessagesConfigStorageOptionsRequired,
  IMessagesConfigStorage,
} from '../../../types';
import { ConfigurationError } from '../configuration.error';

function getMessageStorageConfig(
  config: IRedisSMQConfig,
  key: keyof IMessagesConfigStorage,
): boolean | IMessagesConfigStorageOptions {
  const { store } = config.messages ?? {};
  if (typeof store === 'undefined' || typeof store === 'boolean') {
    return Boolean(store);
  }
  const params = store[key];
  if (params) return params;
  return false;
}

function getMessageStorageParams(
  config: IRedisSMQConfig,
  key: keyof IMessagesConfigStorage,
): IMessagesConfigStorageOptionsRequired {
  const params = getMessageStorageConfig(config, key);
  if (typeof params === 'boolean') {
    return {
      store: params,
      queueSize: 0,
      expire: 0,
    };
  }
  const queueSize = Number(params.queueSize ?? 0);
  if (isNaN(queueSize) || queueSize < 0) {
    throw new ConfigurationError(`Parameter [queueSize] should be >= 0`);
  }
  const expire = Number(params.expire ?? 0);
  if (isNaN(expire) || expire < 0) {
    throw new ConfigurationError(`Parameter [expire] should be >= 0`);
  }
  return {
    store: true,
    queueSize,
    expire,
  };
}

export default function Store(
  config: IRedisSMQConfig,
): IMessagesConfigStorageRequired {
  return {
    acknowledged: getMessageStorageParams(config, 'acknowledged'),
    deadLettered: getMessageStorageParams(config, 'deadLettered'),
  };
}
