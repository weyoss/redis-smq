/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { _getConsumerGroups } from '../consumer-groups/_/_get-consumer-groups.js';
import { _getQueueProperties } from '../queue/_/_get-queue-properties.js';
import { _parseQueueParams } from '../queue/_/_parse-queue-params.js';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../queue/index.js';
import { QueueAcknowledgedMessages } from './queue-acknowledged-messages.js';
import { QueueDeadLetteredMessages } from './queue-dead-lettered-messages.js';
import { QueueMessagesPaginatorSet } from './queue-messages-paginator/queue-messages-paginator-set.js';
import { LinearQueuePendingMessages } from './queue-pending-messages/linear-queue-pending-messages.js';
import { PriorityQueuePendingMessages } from './queue-pending-messages/priority-queue-pending-messages.js';
import { QueueScheduledMessages } from './queue-scheduled-messages.js';
import {
  IQueueGroupConsumersPendingCount,
  IQueueMessagesCount,
} from './types/index.js';

export class QueueMessages extends QueueMessagesPaginatorSet {
  protected priorityQueueMessages;
  protected queuePendingMessages;
  protected queueDeadLetteredMessages;
  protected queueScheduledMessages;
  protected queueAcknowledgedMessages;

  protected redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys> =
    'keyQueueMessages';

  constructor() {
    super();
    this.priorityQueueMessages = new PriorityQueuePendingMessages();
    this.queuePendingMessages = new LinearQueuePendingMessages();
    this.queueDeadLetteredMessages = new QueueDeadLetteredMessages();
    this.queueScheduledMessages = new QueueScheduledMessages();
    this.queueAcknowledgedMessages = new QueueAcknowledgedMessages();
  }

  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const count: IQueueMessagesCount = {
            acknowledged: 0,
            deadLettered: 0,
            pending: 0,
            scheduled: 0,
          };
          async.waterfall(
            [
              (cb: ICallback<IQueueProperties>) =>
                _getQueueProperties(client, queueParams, (err, properties) => {
                  if (err) cb(err);
                  else if (!properties) cb(new CallbackEmptyReplyError());
                  else cb(null, properties);
                }),
              (
                properties: IQueueProperties,
                cb: ICallback<number | IQueueGroupConsumersPendingCount>,
              ) => {
                const { queueType, deliveryModel } = properties;
                const countPendingFn = (
                  groupId: string | null,
                  cb: ICallback<number>,
                ) => {
                  if (queueType === EQueueType.PRIORITY_QUEUE) {
                    this.priorityQueueMessages.countMessages(
                      { queue, groupId },
                      cb,
                    );
                  } else {
                    this.queuePendingMessages.countMessages(
                      { queue, groupId },
                      cb,
                    );
                  }
                };
                if (deliveryModel === EQueueDeliveryModel.PUB_SUB) {
                  _getConsumerGroups(client, queueParams, (err, groups) => {
                    if (err) cb(err);
                    else {
                      const pending: IQueueGroupConsumersPendingCount = {};
                      async.each(
                        groups ?? [],
                        (groupId, _, cb) => {
                          countPendingFn(groupId, (err, cnt) => {
                            if (err) cb(err);
                            else {
                              pending[groupId] = Number(cnt);
                              cb();
                            }
                          });
                        },
                        (err) => cb(err, pending),
                      );
                    }
                  });
                } else countPendingFn(null, cb);
              },
              (
                pending: number | IQueueGroupConsumersPendingCount,
                cb: ICallback<number>,
              ) => {
                count.pending = pending;
                this.queueDeadLetteredMessages.countMessages(queue, cb);
              },
              (deadLettered: number, cb: ICallback<number>) => {
                count.deadLettered = deadLettered;
                this.queueAcknowledgedMessages.countMessages(queue, cb);
              },
              (acknowledged: number, cb: ICallback<number>) => {
                count.acknowledged = acknowledged;
                this.queueScheduledMessages.countMessages(queue, cb);
              },
            ],
            (err, scheduled) => {
              if (err) cb(err);
              else {
                count.scheduled = Number(scheduled);
                cb(null, count);
              }
            },
          );
        }
      });
    }
  }

  override shutdown(cb: ICallback<void>) {
    async.waterfall(
      [
        (cb: ICallback<void>) => this.queuePendingMessages.shutdown(cb),
        (cb: ICallback<void>) => this.priorityQueueMessages.shutdown(cb),
        (cb: ICallback<void>) => this.queueScheduledMessages.shutdown(cb),
        (cb: ICallback<void>) => this.queueAcknowledgedMessages.shutdown(cb),
        (cb: ICallback<void>) => this.queueDeadLetteredMessages.shutdown(cb),
        (cb: ICallback<void>) => super.shutdown(cb),
      ],
      cb,
    );
  }
}
