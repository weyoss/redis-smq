import { IRedisConfig } from 'redis-smq-common';
import { IRedisSMQParsedConfig } from '../../../../contracts/index.js';

export interface IWorkerPayload {
  config: IRedisSMQParsedConfig;
  redisConfig: IRedisConfig;
  loggerContext: {
    namespaces: string[];
  };
}
