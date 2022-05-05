import * as os from 'os';
import {
  ICallback,
  TConsumerQueueParams,
  THeartbeatRegistryPayload,
  TQueueParams,
  TRedisClientMulti,
} from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { each } from '../../lib/async';

const IPAddresses = (() => {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const netInterface in nets) {
    const addr = nets[netInterface] ?? [];
    for (const netAddr of addr) {
      if (netAddr.family === 'IPv4' && !netAddr.internal) {
        addresses.push(netAddr.address);
      }
    }
  }
  return addresses;
})();

export const consumerQueues = {
  removeConsumer(
    multi: TRedisClientMulti,
    queue: TQueueParams,
    consumerId: string,
  ): void {
    const { keyQueueConsumers, keyConsumerQueues } =
      redisKeys.getQueueConsumerKeys(queue, consumerId);
    multi.hdel(keyQueueConsumers, consumerId);
    multi.srem(keyConsumerQueues, JSON.stringify(queue));
  },

  addConsumer(
    multi: TRedisClientMulti,
    queue: TConsumerQueueParams,
    consumerId: string,
  ): void {
    const data: THeartbeatRegistryPayload = {
      ipAddress: IPAddresses,
      hostname: os.hostname(),
      pid: process.pid,
      createdAt: Date.now(),
    };
    const { keyQueueConsumers, keyConsumerQueues } =
      redisKeys.getQueueConsumerKeys(queue, consumerId);
    multi.sadd(keyConsumerQueues, JSON.stringify(queue));
    multi.hset(keyQueueConsumers, consumerId, JSON.stringify(data));
  },

  getQueueConsumers(
    client: RedisClient,
    queue: TQueueParams,
    transform: boolean,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue);
    client.hgetall(keyQueueConsumers, (err, reply) => {
      if (err) cb(err);
      else {
        if (transform) {
          const data: Record<string | number, THeartbeatRegistryPayload> = {};
          each(
            reply ?? {},
            (item, key, done) => {
              data[key] = JSON.parse(item);
              done();
            },
            () => cb(null, data),
          );
        } else cb(null, reply ?? {});
      }
    });
  },

  getQueueConsumerIds(
    client: RedisClient,
    queue: TQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue);
    client.hkeys(keyQueueConsumers, cb);
  },

  countQueueConsumers(
    client: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue);
    client.hlen(keyQueueConsumers, cb);
  },

  getConsumerQueues(
    client: RedisClient,
    consumerId: string,
    cb: ICallback<TQueueParams[]>,
  ): void {
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
    client.smembers(keyConsumerQueues, (err, reply) => {
      if (err) cb(err);
      else {
        const queues: TQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
        cb(null, queues);
      }
    });
  },
};
