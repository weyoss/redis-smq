/*
 * packages/redis-smq/src/core/errors/consumer-groups/consumer-group-has-active-consumers.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../../../contracts/index.js';

export class ConsumerGroupHasActiveConsumersError extends RedisSMQError<{
  queue: IQueueParams;
  consumerGroupId: string;
}> {
  static override readonly code = 'RedisSMQ.ConsumerGroup.HasActiveConsumers';
  static override readonly defaultMessage =
    'The consumer group has active consumers and cannot be deleted. Before deleting a consumer group, make sure all its consumers are offline.';
}
