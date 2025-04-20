/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { RedisClient } from '../../../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../../../common/redis-keys/redis-keys.js';
import { _getMessage } from '../../../../message/_/_get-message.js';
import { MessageEnvelope } from '../../../../message/message-envelope.js';
import { IQueueParams } from '../../../../queue/index.js';

export const processingQueue = {
  fetchMessageFromProcessingQueue(
    redisClient: RedisClient,
    keyQueueProcessing: string,
    cb: ICallback<MessageEnvelope>,
  ): void {
    redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());
      client.lrange(keyQueueProcessing, 0, 0, (err, range) => {
        if (err) {
          return cb(err);
        }
        if (range && range.length) {
          _getMessage(client, range[0], cb);
        } else {
          cb();
        }
      });
    });
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
