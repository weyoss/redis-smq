/*
 * packages/redis-smq/src/core/errors/queue/queue-paused.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueuePausedError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.Paused';
  static override readonly defaultMessage = 'Queue paused.';
}
