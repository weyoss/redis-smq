/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisScriptName } from '../../common/scripts/registry.js';
import {
  ProcessingQueueNotEmptyError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import { ICallback } from 'redis-smq-common';
import { keys as redisKeys } from '../../common/redis/keys/keys.js';
import { withShared } from '../../common/redis/connection-pool/with-shared.js';
import { IQueueParsedParams } from '../../../contracts/index.js';
import { _stringifyQueueParams } from '../../queue-manager/_/_stringify-queue-params.js';

export function _unsubscribeConsumer(
  consumerId: string,
  queueParams: IQueueParsedParams,
  cb: ICallback,
) {
  withShared((redisClient, cb) => {
    const { queueParams: queue, groupId } = queueParams;
    const { keyQueueProcessingQueues, keyQueueConsumers, keyQueueProperties } =
      redisKeys.getQueueKeys(queue.ns, queue.name, groupId);
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue.ns,
      queue.name,
      consumerId,
    );
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);

    const keys = [
      keyQueueProperties,
      keyQueueConsumers,
      keyConsumerQueues,
      keyQueueProcessingQueues,
      keyQueueProcessing,
    ];

    if (groupId) {
      const { keyQueueConsumerGroupConsumers } =
        redisKeys.getQueueConsumerGroupKeys(queue.ns, queue.name, groupId);
      keys.push(keyQueueConsumerGroupConsumers);
    }

    const args = [consumerId, _stringifyQueueParams(queue)];
    redisClient.runScript(
      ERedisScriptName.UNSUBSCRIBE_CONSUMER,
      keys,
      args,
      (err, reply) => {
        if (err) return cb(err);
        if (reply === 'QUEUE_NOT_FOUND')
          return cb(
            new QueueNotFoundError({
              metadata: {
                queue: queue,
              },
            }),
          );
        if (reply === 'PROCESSING_QUEUE_NOT_EMPTY')
          return cb(
            new ProcessingQueueNotEmptyError({
              metadata: { consumerId, queue, groupId },
            }),
          );
        if (reply === 'OK') return cb();
        cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
      },
    );
  }, cb);
}
