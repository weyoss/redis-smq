/*
 * packages/redis-smq/src/core/errors/queue/queue-already-being-purged.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueAlreadyBeingPurgedError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.AlreadyBeingPurged';
  static override readonly defaultMessage = 'Queue is already being purged.';
}
