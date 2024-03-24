/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  IRedisClient,
  IRedisTransaction,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { IQueueParams, TQueueConsumer } from '../queue/index.js';

export const consumerQueues = {
  removeConsumer(
    multi: IRedisTransaction,
    queue: IQueueParams,
    consumerId: string,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
    multi.hdel(keyQueueConsumers, consumerId);
    multi.srem(keyConsumerQueues, JSON.stringify(queue));
  },

  getQueueConsumers(
    client: IRedisClient,
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
    client: IRedisClient,
    queue: IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
    client.hkeys(keyQueueConsumers, cb);
  },

  countQueueConsumers(
    client: IRedisClient,
    queue: IQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
    client.hlen(keyQueueConsumers, cb);
  },

  getConsumerQueues(
    client: IRedisClient,
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
