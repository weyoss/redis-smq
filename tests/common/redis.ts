import { redis, RedisClient } from 'redis-smq-common';
import { promisify, promisifyAll } from 'bluebird';
import { Configuration } from '../../src/config/configuration';

const RedisClientAsync = promisifyAll(RedisClient.prototype);
const createInstanceAsync = promisify(redis.createInstance);
const redisClients: (typeof RedisClientAsync)[] = [];

export async function getRedisInstance() {
  const c = promisifyAll(
    await createInstanceAsync(Configuration.getSetConfig().redis),
  );
  redisClients.push(c);
  return c;
}

export async function shutDownRedisClients() {
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      await redisClient.haltAsync();
    }
  }
}
