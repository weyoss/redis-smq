/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageBrowserAbstract } from '../common/message-browser/message-browser-abstract.js';
import { BrowserStorageSortedSet } from '../common/message-browser/browser-storage/browser-storage-sorted-set.js';
import { EQueueMessagesType } from '../common/queue-messages-registry/queue-messages-types.js';
import { IBrowserStorage } from '../common/message-browser/browser-storage/browser-storage-abstract.js';

export class PriorityQueuePendingMessages extends MessageBrowserAbstract {
  protected override requireGroupId = true;
  protected readonly redisKey = 'keyQueuePriorityPending';
  protected type = EQueueMessagesType.PENDING;

  protected createDefaultStorage(): IBrowserStorage {
    return new BrowserStorageSortedSet(this.logger);
  }
}
