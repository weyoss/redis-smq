/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { _getConsumerGroups } from '../consumer-groups/_/_get-consumer-groups.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../queue-manager/index.js';
import { QueueExplorer } from '../common/queue-explorer/queue-explorer.js';
import { QueueStorageSet } from '../common/queue-explorer/queue-storage/queue-storage-set.js';
import { QueueAcknowledgedMessages } from '../queue-acknowledged-messages/index.js';
import { QueueDeadLetteredMessages } from '../queue-dead-lettered-messages/index.js';
import { SequentialQueuePendingMessages } from '../queue-pending-messages/sequential-queue-pending-messages.js';
import { PriorityQueuePendingMessages } from '../queue-pending-messages/priority-queue-pending-messages.js';
import { QueueScheduledMessages } from '../queue-scheduled-messages/index.js';
import {
  IQueueGroupConsumersPendingCount,
  IQueueMessagesCount,
} from './types/index.js';
import { MessageManager } from '../message-manager/index.js';
import { withSharedPoolConnection } from '../common/redis-connection-pool/with-shared-pool-connection.js';

/**
 * QueueMessages class manages message counting and state reporting across queue types.
 * It orchestrates various message handlers (pending, acknowledged, scheduled, dead-lettered)
 * and leverages a waterfall pattern for processing.
 */
export class QueueMessages extends QueueExplorer {
  protected readonly priorityQueueMessages: PriorityQueuePendingMessages;
  protected readonly queuePendingMessages: SequentialQueuePendingMessages;
  protected readonly queueDeadLetteredMessages: QueueDeadLetteredMessages;
  protected readonly queueScheduledMessages: QueueScheduledMessages;
  protected readonly queueAcknowledgedMessages: QueueAcknowledgedMessages;

  constructor() {
    super(new QueueStorageSet(), new MessageManager(), 'keyQueueMessages');
    this.priorityQueueMessages = new PriorityQueuePendingMessages();
    this.queuePendingMessages = new SequentialQueuePendingMessages();
    this.queueDeadLetteredMessages = new QueueDeadLetteredMessages();
    this.queueScheduledMessages = new QueueScheduledMessages();
    this.queueAcknowledgedMessages = new QueueAcknowledgedMessages();
    this.logger.debug('QueueMessages initialized');
  }

  /**
   * Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.
   * @param queue - Queue string name or parameters.
   * @param cb - Callback function returning the IQueueMessagesCount.
   */
  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      return cb(queueParams);
    }
    withSharedPoolConnection(
      (client, cb) =>
        this.executeCountingPipeline(client, queueParams, queue, cb),
      cb,
    );
  }

  /**
   * Execute a series of counting operations using a waterfall flow.
   * @param client - Redis client instance.
   * @param queueParams - Parsed queue parameters.
   * @param queue - Original queue parameter.
   * @param cb - Callback function that returns a populated IQueueMessagesCount.
   */
  private executeCountingPipeline(
    client: IRedisClient,
    queueParams: IQueueParams,
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    const count: IQueueMessagesCount = {
      pending: 0,
      acknowledged: 0,
      scheduled: 0,
      deadLettered: 0,
    };
    async.waterfall(
      [
        // Retrieve queue properties.
        (next: ICallback<IQueueProperties>) =>
          this.getQueueProperties(client, queueParams, next),

        // Count pending messages, possibly group-wise.
        (
          properties: IQueueProperties,
          next: ICallback<number | IQueueGroupConsumersPendingCount>,
        ) =>
          this.countPendingMessages(
            client,
            properties,
            queue,
            queueParams,
            next,
          ),

        // Count dead-lettered messages.
        (
          pendingCount: number | IQueueGroupConsumersPendingCount,
          next: ICallback<number>,
        ) => {
          count.pending = pendingCount;
          this.queueDeadLetteredMessages.countMessages(queue, next);
        },

        // Count acknowledged messages.
        (deadLettered: number, next: ICallback<number>) => {
          count.deadLettered = deadLettered;
          this.queueAcknowledgedMessages.countMessages(queue, next);
        },

        // Count scheduled messages.
        (acknowledged: number, next: ICallback<number>) => {
          count.acknowledged = acknowledged;
          this.queueScheduledMessages.countMessages(queue, next);
        },
      ],
      (err, scheduled) => {
        if (err) {
          return cb(err);
        }
        count.scheduled = Number(scheduled);
        return cb(null, count);
      },
    );
  }

  /**
   * Retrieve properties for the specified queue.
   * @param client - Redis client.
   * @param queueParams - Parsed queue parameters.
   * @param cb - Callback returning IQueueProperties.
   */
  private getQueueProperties(
    client: IRedisClient,
    queueParams: IQueueParams,
    cb: ICallback<IQueueProperties>,
  ): void {
    _getQueueProperties(client, queueParams, (err, properties) => {
      if (err) {
        return cb(err);
      }
      if (!properties) {
        return cb(new CallbackEmptyReplyError());
      }
      return cb(null, properties);
    });
  }

  /**
   * Count pending messages based on the queue type and delivery model.
   * For PUB_SUB, counts are aggregated for each consumer group.
   * For POINT_TO_POINT, performs a singular pending count.
   * @param client - Redis client.
   * @param properties - Queue properties.
   * @param queue - Original queue parameter.
   * @param queueParams - Parsed queue parameters.
   * @param cb - Callback returning count or group counts.
   */
  private countPendingMessages(
    client: IRedisClient,
    properties: IQueueProperties,
    queue: string | IQueueParams,
    queueParams: IQueueParams,
    cb: ICallback<number | IQueueGroupConsumersPendingCount>,
  ): void {
    const { queueType, deliveryModel } = properties;

    // Count function to abstract pending messages counting per group.
    const countPendingForGroup = (
      groupId: string | null,
      callback: ICallback<number>,
    ) => {
      if (queueType === EQueueType.PRIORITY_QUEUE) {
        this.priorityQueueMessages.countMessages({ queue, groupId }, callback);
      } else {
        this.queuePendingMessages.countMessages({ queue, groupId }, callback);
      }
    };

    if (deliveryModel === EQueueDeliveryModel.PUB_SUB) {
      // For pub/sub, count pending messages per consumer group.
      this.countPendingByGroupId(client, queueParams, countPendingForGroup, cb);
    } else {
      // For point-to-point, count without group segregation.
      countPendingForGroup(null, cb);
    }
  }

  /**
   * Count pending messages for each consumer group and aggregate the result.
   * @param client - Redis client.
   * @param queueParams - Parsed queue parameters.
   * @param countPendingForGroup - Function to count pending for a given group.
   * @param cb - Callback returning an object mapping group IDs to their counts.
   */
  private countPendingByGroupId(
    client: IRedisClient,
    queueParams: IQueueParams,
    countPendingForGroup: (
      groupId: string | null,
      cb: ICallback<number>,
    ) => void,
    cb: ICallback<IQueueGroupConsumersPendingCount>,
  ): void {
    _getConsumerGroups(client, queueParams, (err, groups) => {
      if (err) {
        return cb(err);
      }

      const pendingCounts: IQueueGroupConsumersPendingCount = {};
      async.each(
        groups ?? [],
        (groupId: string, _, next: ICallback<void>) => {
          countPendingForGroup(groupId, (err, cnt) => {
            if (err) {
              return next(err);
            }
            pendingCounts[groupId] = Number(cnt);
            return next();
          });
        },
        (err) => cb(err, pendingCounts),
      );
    });
  }
}
