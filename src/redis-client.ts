import IORedis, { RedisOptions } from 'ioredis';
import { ClientOpts, createClient } from 'redis';
import { IConfig, RedisClientName, TCompatibleRedisClient } from '../types';

export class RedisClient {
  protected static instances: TCompatibleRedisClient[] = [];

  static getNewInstance(
    config: IConfig = {},
    cb: (client: TCompatibleRedisClient) => void,
  ): void {
    const { client = RedisClientName.REDIS, options = {} } = config.redis ?? {};
    if (![RedisClientName.IOREDIS, RedisClientName.REDIS].includes(client)) {
      throw new Error('Invalid Redis driver name');
    }
    const instance = (
      client === RedisClientName.REDIS
        ? createClient(options as ClientOpts)
        : new IORedis(options as RedisOptions)
    ) as TCompatibleRedisClient;
    instance.once('ready', () => {
      RedisClient.instances.push(instance);
      cb(instance);
    });
  }

  static getAllClients(): TCompatibleRedisClient[] {
    return RedisClient.instances;
  }
}
