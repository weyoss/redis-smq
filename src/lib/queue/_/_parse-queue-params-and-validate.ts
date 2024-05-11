/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { QueueQueueNotFoundError } from '../errors/queue-queue-not-found.error.js';
import { IQueueParams } from '../types/queue.js';
import { _parseQueueParams } from './_parse-queue-params.js';
import { _queueExists } from './_queue-exists.js';

export function _parseQueueParamsAndValidate(
  redisClient: IRedisClient,
  queue: string | IQueueParams,
  cb: ICallback<IQueueParams>,
): void {
  const queueParams = _parseQueueParams(queue);
  if (queueParams instanceof Error) cb(queueParams);
  else
    _queueExists(redisClient, queueParams, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new QueueQueueNotFoundError());
      else cb(null, queueParams);
    });
}
