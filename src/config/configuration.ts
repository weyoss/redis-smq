import { IConfig, IRequiredConfig } from '../../types';
import Namespace from './namespace';
import Redis from './redis';
import Logger from './logger';
import Messages from './messages/messages';

export function getConfiguration(config: IConfig = {}): IRequiredConfig {
  return {
    namespace: Namespace(config),
    redis: Redis(config),
    logger: Logger(config),
    messages: Messages(config),
  };
}
