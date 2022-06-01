import { createClientInstance, RedisClient } from 'redis-smq-common';
import { promisify, promisifyAll } from 'bluebird';
import { requiredConfig } from './config';

const createClientInstanceAsync = promisify(createClientInstance);
const redisClients: RedisClient[] = [];

export async function getRedisInstance() {
  const c = promisifyAll(await createClientInstanceAsync(requiredConfig.redis));
  redisClients.push(c);
  return c;
}

export async function shutDownRedisClients() {
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      await promisifyAll(redisClient).haltAsync();
    }
  }
}
