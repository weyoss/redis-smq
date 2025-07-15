/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient, withRedisClient } from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getMessage } from '../../../message/_/_get-message.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { IQueueParams } from '../../../queue/index.js';

export const processingQueue = {
  fetchMessageFromProcessingQueue(
    redisClient: RedisClient,
    keyQueueProcessing: string,
    cb: ICallback<MessageEnvelope>,
  ): void {
    withRedisClient(
      redisClient,
      (client, cb) => {
        client.lrange(keyQueueProcessing, 0, 0, (err, range) => {
          if (err) {
            return cb(err);
          }
          if (range && range.length) {
            return _getMessage(client, range[0], cb);
          }
          cb();
        });
      },
      cb,
    );
  },
  getQueueProcessingQueues(
    redisClient: IRedisClient,
    queue: IQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(queue, null);
    redisClient.hgetall(keyQueueProcessingQueues, cb);
  },
};
