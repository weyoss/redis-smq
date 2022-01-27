import { IConfig, IRequiredConfig } from '../../../types';
import { merge } from 'lodash';
import { redisKeys } from './redis-keys/redis-keys';
import { ConfigurationError } from './errors/configuration.error';

const defaultConfig: IRequiredConfig = {
  namespace: 'default',
  storeMessages: false,
  logger: {
    enabled: false,
  },
  monitor: {
    enabled: false,
  },
  message: {
    consumeTimeout: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    ttl: 0,
  },
};

let currentConfig: IRequiredConfig | null = null;

export function setConfiguration(configuration: IConfig = {}): IRequiredConfig {
  if (currentConfig)
    throw new ConfigurationError(
      'Configuration has been already initialized. Possible configuration overwrite.',
    );
  currentConfig = merge(currentConfig ?? {}, defaultConfig, configuration);
  redisKeys.setNamespace(currentConfig.namespace);
  return currentConfig;
}

export function setConfigurationIfNotExists(): boolean {
  if (!currentConfig) {
    setConfiguration();
    return true;
  }
  return false;
}

export function getConfiguration(): IRequiredConfig {
  return currentConfig ?? defaultConfig;
}
