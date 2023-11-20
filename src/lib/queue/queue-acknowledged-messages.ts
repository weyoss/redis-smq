/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueMessagesPaginatorList } from './queue-messages-paginator/queue-messages-paginator-list';
import { _getQueueParams } from './queue/_get-queue-params';

export class QueueAcknowledgedMessages extends QueueMessagesPaginatorList {
  protected override getRedisKey(queue: string | IQueueParams): string {
    const queueParams = _getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queueParams);
    return keyQueueAcknowledged;
  }
}
