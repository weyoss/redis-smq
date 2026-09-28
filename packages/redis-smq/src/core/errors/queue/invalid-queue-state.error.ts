/*
 * packages/redis-smq/src/core/errors/queue/invalid-queue-state.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class InvalidQueueStateError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.InvalidState';
  static override readonly defaultMessage =
    'The current queue state cannot be recognized.';
}
