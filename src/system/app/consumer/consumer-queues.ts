import * as os from 'os';
import {
  ICallback,
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
  addConsumer(
    multi: TRedisClientMulti,
    queue: TQueueParams,
    instanceId: string,
  ): void {
    const data: THeartbeatRegistryPayload = {
      ipAddress: IPAddresses,
      hostname: os.hostname(),
      pid: process.pid,
      createdAt: Date.now(),
    };
    const { keyQueueConsumers, keyConsumerQueues } =
      redisKeys.getQueueConsumerKeys(queue.name, instanceId, queue.ns);
    multi.sadd(keyConsumerQueues, JSON.stringify(queue));
    multi.hset(keyQueueConsumers, instanceId, JSON.stringify(data));
  },

  removeConsumer(
    multi: TRedisClientMulti,
    consumerId: string,
    queues: TQueueParams[],
  ): void {
    each(
      queues,
      (queue, _, done) => {
        const { keyQueueConsumers } = redisKeys.getQueueKeys(
          queue.name,
          queue.ns,
        );
        multi.hdel(keyQueueConsumers, consumerId);
        done();
      },
      () => void 0,
    );
  },

  exists(
    client: RedisClient,
    keyRegistry: string,
    instanceId: string,
    cb: ICallback<boolean>,
  ): void {
    client.hexists(keyRegistry, instanceId, cb);
  },

  getQueueConsumers(
    client: RedisClient,
    queue: TQueueParams,
    transform: boolean,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue.name, queue.ns);
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
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue.name, queue.ns);
    client.hkeys(keyQueueConsumers, cb);
  },

  countQueueConsumers(
    client: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue.name, queue.ns);
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
