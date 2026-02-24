/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueMessagesAbstract } from './queue-messages-abstract.js';
import { IQueueParams } from '../queue-manager/index.js';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { EQueueMessageType, IQueueMessagesCount } from './types/index.js';

/**
 * QueueMessages class provides browsing capabilities for all messages in a queue,
 * regardless of their status (pending, acknowledged, scheduled, dead-lettered).
 */
export class QueueMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.ALL_MESSAGES;

  /**
   * Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.
   * @param queue - Queue string name or parameters.
   * @param cb - Callback function returning the IQueueMessagesCount.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   */
  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      return cb(queueParams);
    }
    withSharedPoolConnection((client, cb) => {
      _getQueueProperties(client, queueParams, (err, properties) => {
        if (err) {
          return cb(err);
        }
        if (!properties) {
          return cb(new CallbackEmptyReplyError());
        }
        return cb(null, {
          pending: properties.pendingMessagesCount,
          acknowledged: properties.acknowledgedMessagesCount,
          scheduled: properties.scheduledMessagesCount,
          deadLettered: properties.deadLetteredMessagesCount,
        });
      });
    }, cb);
  }
}
