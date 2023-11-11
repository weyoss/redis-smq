import { TQueueConsumer, IQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import {
  async,
  RedisClient,
  ICallback,
  IRedisTransaction,
} from 'redis-smq-common';

export const consumerQueues = {
  removeConsumer(
    multi: IRedisTransaction,
    queue: IQueueParams,
    consumerId: string,
  ): void {
    const { keyQueueConsumers, keyConsumerQueues } =
      redisKeys.getQueueConsumerKeys(queue, consumerId);
    multi.hdel(keyQueueConsumers, consumerId);
    multi.srem(keyConsumerQueues, JSON.stringify(queue));
  },

  getQueueConsumers(
    client: RedisClient,
    queue: IQueueParams,
    transform: boolean,
    cb: ICallback<Record<string, TQueueConsumer | string>>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue);
    client.hgetall(keyQueueConsumers, (err, reply) => {
      if (err) cb(err);
      else {
        const consumers = reply ?? {};
        if (transform) {
          const data: Record<string | number, TQueueConsumer> = {};
          async.eachIn(
            consumers,
            (item, key, done) => {
              data[key] = JSON.parse(item);
              done();
            },
            () => cb(null, data),
          );
        } else cb(null, consumers);
      }
    });
  },

  getQueueConsumerIds(
    client: RedisClient,
    queue: IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue);
    client.hkeys(keyQueueConsumers, cb);
  },

  countQueueConsumers(
    client: RedisClient,
    queue: IQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue);
    client.hlen(keyQueueConsumers, cb);
  },

  getConsumerQueues(
    client: RedisClient,
    consumerId: string,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
    client.smembers(keyConsumerQueues, (err, reply) => {
      if (err) cb(err);
      else {
        const queues: IQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
        cb(null, queues);
      }
    });
  },
};
