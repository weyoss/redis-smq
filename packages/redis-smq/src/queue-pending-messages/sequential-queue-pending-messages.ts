/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageBrowserAbstract } from '../common/message-browser/message-browser-abstract.js';
import { BrowserStorageList } from '../common/message-browser/browser-storage/browser-storage-list.js';
import { EQueueMessagesType } from '../common/queue-messages-registry/queue-messages-types.js';
import { ILogger } from 'redis-smq-common';
import { BrowserStorageAbstract } from '../common/message-browser/browser-storage/browser-storage-abstract.js';

export class SequentialQueuePendingMessages extends MessageBrowserAbstract {
  protected override requireGroupId = true;
  protected readonly redisKey = 'keyQueuePending';
  protected type = EQueueMessagesType.PENDING;

  protected geMessageStorage(logger: ILogger): BrowserStorageAbstract {
    return new BrowserStorageList(logger);
  }
}
