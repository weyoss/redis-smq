/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams, TQueueConsumer } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import {
  async,
  ICallback,
  IRedisTransaction,
  RedisClient,
} from 'redis-smq-common';

export const consumerQueues = {
  removeConsumer(
    multi: IRedisTransaction,
    queue: IQueueParams,
    consumerId: string,
  ): void {
    const { keyQueueConsumers, keyConsumerQueues } =
      redisKeys.getQueueConsumerKeys(queue, consumerId, null);
    multi.hdel(keyQueueConsumers, consumerId);
    multi.srem(keyConsumerQueues, JSON.stringify(queue));
  },

  getQueueConsumers(
    client: RedisClient,
    queue: IQueueParams,
    transform: boolean,
    cb: ICallback<Record<string, TQueueConsumer | string>>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
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
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
    client.hkeys(keyQueueConsumers, cb);
  },

  countQueueConsumers(
    client: RedisClient,
    queue: IQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
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
