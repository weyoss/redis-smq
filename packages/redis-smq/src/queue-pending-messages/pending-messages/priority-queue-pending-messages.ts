/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BrowserStorageSortedSet } from '../../common/message-browser/browser-storage/browser-storage-sorted-set.js';
import { IBrowserStorage } from '../../common/message-browser/browser-storage/browser-storage-abstract.js';
import { PendingMessagesAbstract } from './pending-messages-abstract.js';

export class PriorityQueuePendingMessages extends PendingMessagesAbstract {
  protected readonly redisKey = 'keyQueuePriorityPending';

  protected createDefaultStorage(): IBrowserStorage {
    return new BrowserStorageSortedSet(this.logger);
  }
}
