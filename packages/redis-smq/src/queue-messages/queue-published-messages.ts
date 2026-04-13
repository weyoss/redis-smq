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
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import {
  EQueueMessageType,
  IQueuePublishedMessagesCountByStatus,
} from './types/index.js';

/**
 * Handles all messages published to a queue regardless of their status.
 *
 * Provides browsing capabilities for pending, acknowledged, scheduled, and dead-lettered messages,
 * plus a method to get counts broken down by status.
 *
 * @example
 * const published = new QueuePublishedMessages();
 *
 * // Get counts by status
 * const counts = await published.countMessagesByStatus('orders');
 * console.log(counts.pending, counts.acknowledged);
 *
 * // Browse published messages (inherited from QueueMessagesAbstract)
 * const page = await published.getMessages('orders', 1, 20);
 */
export class QueuePublishedMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.PUBLISHED;

  /**
   * Gets message counts broken down by status.
   *
   * Returns counts for: pending, acknowledged, scheduled, and dead-lettered messages.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, counts) => void. Returns IQueuePublishedMessagesCountByStatus
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const counts = await published.countMessagesByStatus('orders');
   * console.log(`Pending: ${counts.pending}`);
   *
   * // Callback
   * published.countMessagesByStatus('orders', (err, counts) => {
   *   if (err) throw err;
   *   console.log(counts);
   * });
   */
  countMessagesByStatus(
    queue: string | IQueueParams,
  ): Promise<IQueuePublishedMessagesCountByStatus>;
  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueuePublishedMessagesCountByStatus>,
  ): void;
  countMessagesByStatus(
    queue: string | IQueueParams,
    cb?: ICallback<IQueuePublishedMessagesCountByStatus>,
  ): Promise<IQueuePublishedMessagesCountByStatus> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        return callback(queueParams);
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
      }, callback);
    });
  }
}
