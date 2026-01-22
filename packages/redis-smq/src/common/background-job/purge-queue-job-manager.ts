/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BackgroundJobManagerAbstract } from './background-job-manager-abstract.js';
import { ILogger, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../redis/redis-keys/redis-keys.js';
import { IQueueParsedParams } from '../../queue-manager/index.js';
import { EQueueMessageType } from '../queue-messages-registry/types/queue-messages-registry.js';

export type TPurgeQueueJobTarget = {
  queue: IQueueParsedParams;
  messageType: EQueueMessageType;
};

export class PurgeQueueJobManager extends BackgroundJobManagerAbstract<TPurgeQueueJobTarget> {
  constructor(redisClient: IRedisClient, logger: ILogger) {
    const keys = redisKeys.getMainKeys();
    super(
      redisClient,
      {
        keyBackgroundJobs: keys.keyPurgeQueueBackgroundJobs,
        keyBackgroundJobsPending: keys.keyPurgeQueueBackgroundJobsPending,
        keyBackgroundJobsProcessing: keys.keyPurgeQueueBackgroundJobsProcessing,
      },
      logger,
    );
  }

  override getTargetLockKey(target: TPurgeQueueJobTarget): string {
    const { keyPurgeQueueTargetLock } = redisKeys.getPurgeQueueTargetKeys(
      target.queue.queueParams,
      target.queue.groupId,
    );
    return keyPurgeQueueTargetLock;
  }
}
