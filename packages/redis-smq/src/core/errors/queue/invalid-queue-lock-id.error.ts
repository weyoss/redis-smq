/*
 * packages/redis-smq/src/core/errors/queue/invalid-queue-lock-id.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class InvalidQueueLockIdError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.InvalidQueueLockId';
  static override readonly defaultMessage =
    "The provided lock ID doesn't match the queue's current lock.";
}
