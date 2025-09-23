/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueExplorer } from '../common/queue-explorer/queue-explorer.js';
import { QueueStorageList } from '../common/queue-explorer/queue-storage/queue-storage-list.js';
import { MessageManager } from '../message-manager/index.js';

/**
 * Manages acknowledged messages in a queue.
 *
 * Acknowledged messages are those that have been successfully processed by consumers
 * and can be safely removed from the active queue. This class allows for tracking
 * and management of these messages when the system is configured to store them.
 *
 * @extends QueueExplorer
 * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/configuration.md#message-storage
 */
export class QueueAcknowledgedMessages extends QueueExplorer {
  constructor() {
    super(new QueueStorageList(), new MessageManager(), 'keyQueueAcknowledged');
    this.logger.debug('QueueAcknowledgedMessages initialized');
  }
}
