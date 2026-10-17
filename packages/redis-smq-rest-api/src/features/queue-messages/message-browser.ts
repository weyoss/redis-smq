/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Deps } from '../../deps/index.js';
import { MessageStatus } from './MessageStatus.js';

/**
 * Returns the browser for the requested status.
 *
 * The three endpoints in this folder (`get`, `purge`, `count`) all
 * accept an optional `status` query parameter and delegate to a
 * different redis-smq manager based on its value. The selection logic
 * lives here so a single change updates all three.
 *
 * `undefined` maps to `queuePublishedMessages`, which is the
 * aggregate view — the same choice the original package's
 * `QueueMessagesService.getMessageBrowser` made.
 */
export function selectMessageBrowser(deps: Deps, status?: MessageStatus) {
  if (status === 'pending') return deps.queuePendingMessages;
  if (status === 'dead-lettered') return deps.queueDeadLetteredMessages;
  if (status === 'acknowledged') return deps.queueAcknowledgedMessages;
  if (status === 'scheduled') return deps.queueScheduledMessages;
  return deps.queuePublishedMessages;
}
