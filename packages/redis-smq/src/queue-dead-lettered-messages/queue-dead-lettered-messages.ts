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

/**
 * Manages dead-lettered messages in a queue.
 *
 * Dead-lettered messages are those that have failed processing multiple times
 * and exceeded their retry limits.  When the system is configured to store them,
 * these messages are moved to a dead-letter queue for later inspection, troubleshooting, or manual reprocessing.
 *
 * @extends QueueExplorer
 * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/configuration.md#message-storage
 */
export class QueueDeadLetteredMessages extends QueueExplorer {
  constructor() {
    const redisClient = new RedisClient();
    super(
      redisClient,
      new QueueStorageList(redisClient),
      new Message(),
      'keyQueueDL',
    );
    this.logger.debug('QueueDeadLetteredMessages initialized');
  }
}
