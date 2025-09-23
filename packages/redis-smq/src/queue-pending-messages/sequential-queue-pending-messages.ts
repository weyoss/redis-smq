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

export class SequentialQueuePendingMessages extends QueueExplorer {
  protected override requireGroupId = true;

  constructor() {
    super(new QueueStorageList(), new MessageManager(), 'keyQueuePending');
    this.logger.debug('SequentialQueuePendingMessages initialized');
  }
}
