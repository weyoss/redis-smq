/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueExplorer } from '../common/queue-explorer/queue-explorer.js';
import { QueueStorageSortedSet } from '../common/queue-explorer/queue-storage/queue-storage-sorted-set.js';
import { MessageManager } from '../message-manager/index.js';

export class QueueScheduledMessages extends QueueExplorer {
  constructor() {
    super(
      new QueueStorageSortedSet(),
      new MessageManager(),
      'keyQueueScheduled',
    );
    this.logger.debug('QueueScheduledMessages initialized');
  }
}
