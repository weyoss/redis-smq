/*
 * packages/redis-smq/src/core/errors/queue/queue-lock-owner-mismatch.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueLockOwnerMismatchError extends RedisSMQError<{
  queue: IQueueParams;
  expectedOwner: string;
  actualOwner: unknown;
}> {
  static override readonly code = 'RedisSMQ.Queue.LockOwnerMismatch';
  static override readonly defaultMessage =
    'Queue lock is owned by another process.';
}
