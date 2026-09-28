/*
 * packages/redis-smq/src/core/errors/queue/queue-locked.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueLockedError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.Locked';
  static override readonly defaultMessage = 'Queue locked.';
}
