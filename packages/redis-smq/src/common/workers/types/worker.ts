import { IRedisSMQParsedConfig } from '../../../config-manager/index.js';
import { IRedisConfig } from 'redis-smq-common';

export interface IWorkerPayload {
  config: IRedisSMQParsedConfig;
  redisConfig: IRedisConfig;
  loggerContext: {
    namespaces: string[];
  };
}
