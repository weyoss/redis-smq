/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClient } from '../../../../common/redis-client/redis-client.js';
import { Message } from '../../../message/index.js';
import { QueueMessagesManagerAbstract } from '../../queue-messages-manager/queue-messages-manager-abstract.js';
import { QueueMessagesStorageSortedSet } from '../../queue-messages-storage/queue-messages-storage-sorted-set.js';

export class PriorityQueuePendingMessages extends QueueMessagesManagerAbstract {
  protected override requireGroupId = true;
  constructor() {
    const redisClient = new RedisClient();
    super(
      redisClient,
      new QueueMessagesStorageSortedSet(redisClient),
      new Message(),
      'keyQueuePriorityPending',
    );
  }
}
