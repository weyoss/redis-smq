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
import { IBrowserStorage } from '../common/message-browser/browser-storage/browser-storage-abstract.js';
import { EQueueMessageType } from '../common/queue-messages-registry/types/queue-messages-registry.js';

export class QueueScheduledMessages extends MessageBrowserAbstract {
  readonly messageType = EQueueMessageType.SCHEDULED;

  protected readonly redisKey = 'keyQueueScheduled';

  protected createDefaultStorage(): IBrowserStorage {
    return new BrowserStorageSortedSet(this.logger);
  }
}
