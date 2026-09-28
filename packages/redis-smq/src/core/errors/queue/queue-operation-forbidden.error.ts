/*
 * packages/redis-smq/src/core/errors/queue/queue-operation-forbidden.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { EQueueOperation, IQueueParams } from '../../../contracts/index.js';

export class QueueOperationForbiddenError extends RedisSMQError<{
  operation: EQueueOperation;
  queue: IQueueParams;
}> {
  static override readonly code = 'RedisSMQ.Queue.OperationForbidden';
  static override readonly defaultMessage =
    'The current queue state does not allow the requested operation. Try again later.';
}
