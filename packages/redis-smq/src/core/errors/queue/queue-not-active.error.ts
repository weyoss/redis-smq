/*
 * packages/redis-smq/src/core/errors/queue/queue-not-active.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueNotActiveError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.NotActive';
  static override readonly defaultMessage = 'Queue not active.';
}
