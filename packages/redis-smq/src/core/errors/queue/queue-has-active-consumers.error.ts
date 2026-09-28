/*
 * packages/redis-smq/src/core/errors/queue/queue-has-active-consumers.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class QueueHasActiveConsumersError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.HasActiveConsumers';
  static override readonly defaultMessage =
    'The queue has active consumers and cannot be deleted. Before deleting a queue, make sure all its consumers are offline.';
}
