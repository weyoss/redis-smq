/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueGroupConsumersPendingCount,
  IQueueMessagesCount,
  IQueueParams,
  IQueueProperties,
} from '../../../../types';
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { QueueMessagesPaginatorSet } from '../queue-messages-paginator/queue-messages-paginator-set';
import { PriorityQueuePendingMessages } from '../queue-pending-messages/priority-queue-pending-messages';
import { LinearQueuePendingMessages } from '../queue-pending-messages/linear-queue-pending-messages';
import { QueueDeadLetteredMessages } from '../queue-dead-lettered-messages';
import { QueueAcknowledgedMessages } from '../queue-acknowledged-messages';
import { QueueScheduledMessages } from '../queue-scheduled-messages';
import { _parseQueueParams } from '../queue/_parse-queue-params';
import { _getQueueProperties } from '../queue/_get-queue-properties';
import { _getConsumerGroups } from '../../consumer/consumer-groups/_get-consumer-groups';

export class QueueMessages extends QueueMessagesPaginatorSet {
  protected redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys> =
    'keyQueueMessages';

  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      _getCommonRedisClient((err, client) => {
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
                    const priorityQueueMessages =
                      new PriorityQueuePendingMessages();
                    priorityQueueMessages.countMessages({ queue, groupId }, cb);
                  } else {
                    const queuePendingMessages =
                      new LinearQueuePendingMessages();
                    queuePendingMessages.countMessages({ queue, groupId }, cb);
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
                const queueDeadLetteredMessages =
                  new QueueDeadLetteredMessages();
                queueDeadLetteredMessages.countMessages(queue, cb);
              },
              (deadLettered: number, cb: ICallback<number>) => {
                count.deadLettered = deadLettered;
                const queueAcknowledgedMessages =
                  new QueueAcknowledgedMessages();
                queueAcknowledgedMessages.countMessages(queue, cb);
              },
              (acknowledged: number, cb: ICallback<number>) => {
                count.acknowledged = acknowledged;
                const queueScheduledMessages = new QueueScheduledMessages();
                queueScheduledMessages.countMessages(queue, cb);
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
}
