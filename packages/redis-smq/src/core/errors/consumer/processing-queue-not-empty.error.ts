/*
 * packages/redis-smq/src/core/errors/consumer/processing-queue-not-empty.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class ProcessingQueueNotEmptyError extends RedisSMQError<{
  consumerId: string;
  queue: IQueueParams;
  groupId: string | null;
}> {
  static override readonly code = 'RedisSMQ.Consumer.ProcessingQueueNotEmpty';
  static override readonly defaultMessage =
    'Consumer processing queue is not empty.';
}
