import { IConfig, IRequiredConfig } from '../../types';
import { ConfigurationError } from './configuration.error';
import Namespace from './namespace';
import Redis from './redis';
import Logger from './logger';
import Messages from './messages/messages';

let currentConfig: IRequiredConfig | null = null;

export function setConfiguration(config: IConfig = {}): IRequiredConfig {
  if (currentConfig)
    throw new ConfigurationError(
      'Configuration has been already initialized. Possible configuration overwrite.',
    );
  currentConfig = {
    namespace: Namespace(config),
    redis: Redis(config),
    logger: Logger(config),
    messages: Messages(config),
  };
  return currentConfig;
}

export function getConfiguration(): IRequiredConfig {
  return currentConfig ?? setConfiguration();
}
