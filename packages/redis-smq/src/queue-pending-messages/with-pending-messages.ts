/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TQueueExtendedParams } from '../queue-manager/index.js';
import { IMessageBrowser } from '../common/index.js';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { PendingMessagesFactory } from './pending-mesages-factory.js';

export function withPendingMessages<T>(
  queue: TQueueExtendedParams,
  operation: (pendingMessages: IMessageBrowser, cb: ICallback<T>) => void,
  cb: ICallback<T>,
) {
  PendingMessagesFactory.getPendingMessages(queue, (err, pendingMessages) => {
    if (err) return cb(err);
    if (!pendingMessages) return cb(new CallbackEmptyReplyError());
    operation(pendingMessages, cb);
  });
}
