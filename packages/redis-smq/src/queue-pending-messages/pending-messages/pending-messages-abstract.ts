/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageBrowserAbstract } from '../../common/message-browser/message-browser-abstract.js';
import { EQueueMessageType } from '../../common/index.js';

export abstract class PendingMessagesAbstract extends MessageBrowserAbstract {
  protected override requireGroupId = true;
  readonly messageType = EQueueMessageType.PENDING;
}
