/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { _getMessage } from '../../../message-manager/_/_get-message.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { IQueueParams } from '../../../queue-manager/index.js';

export const processingQueue = {
  fetchMessageFromProcessingQueue(
    redisClient: IRedisClient,
    keyQueueProcessing: string,
    cb: ICallback<MessageEnvelope>,
  ): void {
    redisClient.lrange(keyQueueProcessing, 0, 0, (err, range) => {
      if (err) {
        return cb(err);
      }
      if (range && range.length) {
        return _getMessage(redisClient, range[0], cb);
      }
      cb();
    });
  },
  getQueueProcessingQueues(
    redisClient: IRedisClient,
    queue: IQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(
      queue.ns,
      queue.name,
      null,
    );
    redisClient.hgetall(keyQueueProcessingQueues, cb);
  },
};
