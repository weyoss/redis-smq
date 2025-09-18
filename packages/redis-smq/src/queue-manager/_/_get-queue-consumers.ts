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
import { IQueueParams, TQueueConsumer } from '../types/index.js';

/**
 * Retrieves all consumers associated with a specific queue-manager.
 *
 * @param client - The Redis client instance.
 * @param queue - The queue-manager parameters.
 * @param cb - The callback function to handle the result.
 */
export function _getQueueConsumers(
  client: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<Record<string, TQueueConsumer>>,
): void {
  const { keyQueueConsumers } = redisKeys.getQueueKeys(queue, null);
  client.hgetall(keyQueueConsumers, (err, reply) => {
    if (err) return cb(err);
    const consumers = reply ?? {};
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
}
