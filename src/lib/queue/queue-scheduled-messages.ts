import { IQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueMessagesPaginatorSortedSet } from './queue-messages-paginator/queue-messages-paginator-sorted-set';
import { _getQueueParams } from './queue/_get-queue-params';

export class QueueScheduledMessages extends QueueMessagesPaginatorSortedSet {
  protected override getRedisKey(queue: string | IQueueParams): string {
    const queueParams = _getQueueParams(queue);
    const { keyQueueScheduled } = redisKeys.getQueueKeys(queueParams);
    return keyQueueScheduled;
  }
}
