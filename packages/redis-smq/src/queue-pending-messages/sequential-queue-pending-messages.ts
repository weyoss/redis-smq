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

export class SequentialQueuePendingMessages extends QueueMessagesAbstract {
  protected override requireGroupId = true;

  constructor() {
    super(new QueueStorageList(), new MessageManager(), 'keyQueuePending');
    this.logger.debug('SequentialQueuePendingMessages initialized');
  }
}
