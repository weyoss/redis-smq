/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageBrowserAbstract } from '../common/message-browser/message-browser-abstract.js';
import { BrowserStorageList } from '../common/message-browser/browser-storage/browser-storage-list.js';
import { MessageManager } from '../message-manager/index.js';

export class SequentialQueuePendingMessages extends MessageBrowserAbstract {
  protected override requireGroupId = true;

  constructor() {
    super(new BrowserStorageList(), new MessageManager(), 'keyQueuePending');
    this.logger.debug('SequentialQueuePendingMessages initialized');
  }
}
