/*
 * packages/redis-smq/src/core/errors/queue/queue-stopped.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueStoppedError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.Stopped';
  static override readonly defaultMessage = 'Queue stopped.';
}
