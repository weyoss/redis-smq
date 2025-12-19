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
import { MessageManager } from '../message-manager/index.js';

export class QueueScheduledMessages extends MessageBrowserAbstract {
  constructor() {
    super(
      new BrowserStorageSortedSet(),
      new MessageManager(),
      'keyQueueScheduled',
    );
    this.logger.debug('QueueScheduledMessages initialized');
  }
}
