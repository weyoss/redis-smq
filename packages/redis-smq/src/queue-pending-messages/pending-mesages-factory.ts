/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageBrowser } from '../common/index.js';
import { PriorityQueuePendingMessages } from './priority-queue-pending-messages.js';
import { SequentialQueuePendingMessages } from './sequential-queue-pending-messages.js';
import { EQueueType, TQueueExtendedParams } from '../queue-manager/index.js';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';

export class PendingMessagesFactory {
  static createPriorityQueueMessages(): IMessageBrowser {
    return new PriorityQueuePendingMessages();
  }

  static createSequentialQueueMessages(): IMessageBrowser {
    return new SequentialQueuePendingMessages();
  }

  static getPendingMessages(
    queue: TQueueExtendedParams,
    cb: ICallback<IMessageBrowser>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      cb(parsedParams);
      return;
    }
    withSharedPoolConnection(
      (client, callback) =>
        _getQueueProperties(
          client,
          parsedParams.queueParams,
          (err, properties) => {
            if (err) {
              callback(err);
              return;
            }

            if (!properties) {
              callback(new CallbackEmptyReplyError());
              return;
            }

            const implementation =
              properties.queueType === EQueueType.PRIORITY_QUEUE
                ? PendingMessagesFactory.createPriorityQueueMessages()
                : PendingMessagesFactory.createSequentialQueueMessages();

            callback(null, implementation);
          },
        ),
      cb,
    );
  }
}
