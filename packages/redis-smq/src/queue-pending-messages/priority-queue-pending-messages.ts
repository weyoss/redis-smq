/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClient } from '../common/redis-client/redis-client.js';
import { QueueExplorer } from '../common/queue-explorer/queue-explorer.js';
import { QueueStorageSortedSet } from '../common/queue-explorer/queue-storage/queue-storage-sorted-set.js';
import { MessageManager } from '../message-manager/index.js';

export class PriorityQueuePendingMessages extends QueueExplorer {
  protected override requireGroupId = true;

  constructor() {
    const redisClient = new RedisClient();
    super(
      redisClient,
      new QueueStorageSortedSet(redisClient),
      new MessageManager(),
      'keyQueuePriorityPending',
    );
    this.logger.debug('PriorityQueuePendingMessages initialized');
  }
}
