/*
 * packages/redis-smq/src/core/errors/queue/queue-not-found.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueNotFoundError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.NotFound';
  static override readonly defaultMessage = 'Queue does not exist.';
}
