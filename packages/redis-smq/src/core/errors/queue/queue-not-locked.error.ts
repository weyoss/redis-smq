/*
 * packages/redis-smq/src/core/errors/queue/queue-not-locked.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueNotLockedError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.NotLocked';
  static override readonly defaultMessage = 'Queue is not locked.';
}
