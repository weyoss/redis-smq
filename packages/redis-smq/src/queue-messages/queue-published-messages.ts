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
import {
  EQueueMessageType,
  IQueuePublishedMessagesCountByStatus,
} from './types/index.js';

/**
 * QueuePublishedMessages class provides browsing capabilities for all messages
 * that entered a queue, regardless of their status (pending, acknowledged,
 * scheduled, dead-lettered).
 */
export class QueuePublishedMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.PUBLISHED;

  /**
   * Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.
   * @param queue - Queue string name or parameters.
   * @param cb - Callback function returning the IQueuePublishedMessagesCount.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   */
  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueuePublishedMessagesCountByStatus>,
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
