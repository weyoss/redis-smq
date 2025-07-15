/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClient } from '../common/redis-client/redis-client.js';
import { Message } from '../message/index.js';
import { QueueExplorer } from '../common/queue-explorer/queue-explorer.js';
import { QueueStorageList } from '../common/queue-explorer/queue-storage/queue-storage-list.js';

export class SequentialQueuePendingMessages extends QueueExplorer {
  protected override requireGroupId = true;
  constructor() {
    const redisClient = new RedisClient();
    super(
      redisClient,
      new QueueStorageList(redisClient),
      new Message(),
      'keyQueuePending',
    );
    this.logger.debug('SequentialQueuePendingMessages initialized');
  }
}
