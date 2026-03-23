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
 * QueuePublishedMessages class provides browsing capabilities for all messages
 * that entered a queue, regardless of their status (pending, acknowledged,
 * scheduled, dead-lettered).
 *
 * @example
 * ```typescript
 * const publishedMessages = new QueuePublishedMessages();
 *
 * // Using callback
 * publishedMessages.countMessagesByStatus('my-queue', (err, counts) => {
 *   if (err) {
 *     console.error('Failed to count messages:', err);
 *   } else {
 *     console.log('Message counts by status:', counts);
 *   }
 * });
 *
 * // Using promise
 * const counts = await publishedMessages.countMessagesByStatus('my-queue');
 * console.log('Message counts by status:', counts);
 * ```
 */
export class QueuePublishedMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.PUBLISHED;

  /**
   * Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.
   *
   * This method provides a comprehensive view of all messages that have been published to a queue,
   * categorized by their current state in the system. It returns counts for:
   * - **Pending**: Messages waiting to be processed
   * - **Acknowledged**: Messages that have been successfully processed and acknowledged
   * - **Scheduled**: Messages scheduled for future delivery
   * - **Dead-lettered**: Messages that failed processing and have been moved to the dead-letter queue
   *
   * **Error Handling:**
   * - Returns `InvalidQueueParametersError` if the queue parameters are malformed
   * - Returns `QueueNotFoundError` if the specified queue does not exist
   * - Returns `CallbackEmptyReplyError` if queue properties cannot be retrieved
   *
   * @param queue - Queue string name (uses default namespace) or queue parameters object
   *                with `{ ns: string, name: string }` for custom namespace
   * @param cb - Optional callback function invoked with the message counts or error.
   *             - On success: `cb(null, counts)` where `counts` is an object containing
   *               counts for pending, acknowledged, scheduled, and dead-lettered messages.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the counts
   *               or rejects with an error.
   * @returns {Promise<IQueuePublishedMessagesCountByStatus> | void} - Returns a Promise if no
   *          callback is provided, otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {CallbackEmptyReplyError} When queue properties cannot be retrieved from Redis.
   *
   * @example
   * ```typescript
   * const publishedMessages = new QueuePublishedMessages();
   *
   * // Example 1: Using callback pattern
   * publishedMessages.countMessagesByStatus('orders', (err, counts) => {
   *   if (err) {
   *     console.error('Failed to count messages:', err);
   *     return;
   *   }
   *   console.log('Message counts by status:');
   *   console.log(`  Pending: ${counts.pending}`);
   *   console.log(`  Acknowledged: ${counts.acknowledged}`);
   *   console.log(`  Scheduled: ${counts.scheduled}`);
   *   console.log(`  Dead-lettered: ${counts.deadLettered}`);
   * });
   *
   * // Example 2: Using promise with async/await
   * try {
   *   const counts = await publishedMessages.countMessagesByStatus({
   *     ns: 'production',
   *     name: 'user-events'
   *   });
   *   console.log('Message statistics:', counts);
   * } catch (err) {
   *   console.error('Failed to retrieve message counts:', err);
   * }
   * ```
   *
   * @see {@link QueueMessagesAbstract} For base message browsing functionality.
   * @see {@link IQueuePublishedMessagesCountByStatus} For the structure of the returned counts.
   * @see {@link QueuePendingMessages} For working with pending messages specifically.
   * @see {@link QueueAcknowledgedMessages} For working with acknowledged messages.
   * @see {@link QueueScheduledMessages} For working with scheduled messages.
   * @see {@link QueueDeadLetteredMessages} For working with dead-lettered messages.
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
