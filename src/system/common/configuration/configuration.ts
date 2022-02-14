import { IConfig, IRequiredConfig } from '../../../../types';
import { merge } from 'lodash';
import { redisKeys } from '../redis-keys/redis-keys';
import { ConfigurationError } from './configuration.error';
import { defaultConfiguration } from './default-configuration';
import { getRequiredMessageStorageConfig } from './message-storage';

let currentConfig: IRequiredConfig | null = null;

export function setConfiguration(config: IConfig = {}): IRequiredConfig {
  if (currentConfig)
    throw new ConfigurationError(
      'Configuration has been already initialized. Possible configuration overwrite.',
    );
  const userConfiguration = {
    ...config,
  };
  const storeMessages = getRequiredMessageStorageConfig(userConfiguration);
  delete userConfiguration.storeMessages;
  currentConfig = merge({}, defaultConfiguration, userConfiguration, {
    storeMessages,
  });
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
  return currentConfig ?? defaultConfiguration;
}
