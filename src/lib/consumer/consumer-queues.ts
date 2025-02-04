/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { IQueueParams, TQueueConsumer } from '../queue/index.js';

/**
 * A collection of functions for interacting with Redis queues and consumers.
 */
export const consumerQueues = {
  /**
   * Retrieves all consumers associated with a specific queue.
   *
   * @param client - The Redis client instance.
   * @param queue - The queue parameters.
   * @param transform - A flag indicating whether to transform the consumer data.
   * @param cb - The callback function to handle the result.
   *
   * @returns void
   */
  getQueueConsumers(
    client: IRedisClient,
    queue: IQueueParams,
    transform: boolean,
    cb: ICallback<Record<string, TQueueConsumer | string>>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
    client.hgetall(keyQueueConsumers, (err, reply) => {
      if (err) return cb(err);

      const consumers = reply ?? {};
      if (!transform) return cb(null, consumers);

      const data: Record<string | number, TQueueConsumer> = {};
      async.eachIn(
        consumers,
        (item, key, done) => {
          data[key] = JSON.parse(item);
          done();
        },
        () => cb(null, data),
      );
    });
  },

  /**
   * Retrieves all consumer IDs associated with a specific queue.
   *
   * @param client - The Redis client instance.
   * @param queue - The queue parameters.
   * @param cb - The callback function to handle the result.
   *
   * @returns void
   */
  getQueueConsumerIds(
    client: IRedisClient,
    queue: IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
    client.hkeys(keyQueueConsumers, cb);
  },

  /**
   * Retrieves all queues associated with a specific consumer.
   *
   * @param client - The Redis client instance.
   * @param consumerId - The consumer ID.
   * @param cb - The callback function to handle the result.
   *
   * @returns void
   */
  getConsumerQueues(
    client: IRedisClient,
    consumerId: string,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
    client.smembers(keyConsumerQueues, (err, reply) => {
      if (err) return cb(err);
      const queues: IQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
      cb(null, queues);
    });
  },
};
