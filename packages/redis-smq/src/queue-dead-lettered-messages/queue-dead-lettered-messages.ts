/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueMessagesAbstract } from '../common/queue-messages/queue-messages-abstract.js';
import { QueueStorageList } from '../common/queue-messages/queue-storage/queue-storage-list.js';
import { MessageManager } from '../message-manager/index.js';

/**
 * Manages dead-lettered messages in a queue.
 *
 * Dead-lettered messages are those that have failed processing multiple times
 * and exceeded their retry limits.  When the system is configured to store them,
 * these messages are moved to a dead-letter queue for later inspection, troubleshooting, or manual reprocessing.
 *
 * @extends QueueMessagesAbstract
 * @see /packages/redis-smq/docs/configuration.md#message-audit
 */
export class QueueDeadLetteredMessages extends QueueMessagesAbstract {
  constructor() {
    super(new QueueStorageList(), new MessageManager(), 'keyQueueDL');
    this.logger.debug('QueueDeadLetteredMessages initialized');
  }
}
