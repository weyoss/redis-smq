/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueType,
  IQueueMessagesCount,
  IQueueParams,
} from '../../../../types';
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { Message } from '../../message/message';
import { QueueMessagesPaginatorSet } from '../queue-messages-paginator/queue-messages-paginator-set';
import { PriorityQueueMessages } from '../priority-queue-messages';
import { LinearQueueMessages } from '../linear-queue-messages';
import { QueueDeadLetteredMessages } from '../queue-dead-lettered-messages';
import { QueueAcknowledgedMessages } from '../queue-acknowledged-messages';
import { QueueScheduledMessages } from '../queue-scheduled-messages';
import { _getMessage, _getMessages } from './_get-message';
import { _deleteMessage } from './_delete-message';
import { _getQueueParams } from '../queue/_get-queue-params';
import { _getQueueProperties } from '../queue/_get-queue-properties';

export class QueueMessages extends QueueMessagesPaginatorSet {
  protected override getRedisKey(queue: string | IQueueParams): string {
    const queueParams = _getQueueParams(queue);
    const { keyPriorityQueuePending } = redisKeys.getQueueKeys(queueParams);
    return keyPriorityQueuePending;
  }

  getMessagesByIds(messageIds: string[], cb: ICallback<Message[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessages(client, messageIds, cb);
    });
  }

  getMessageById(messageId: string, cb: ICallback<Message>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessage(client, messageId, cb);
    });
  }

  countMessagesByStatus(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessagesCount>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        const count: IQueueMessagesCount = {
          acknowledged: 0,
          deadLettered: 0,
          pending: 0,
          scheduled: 0,
        };
        async.waterfall(
          [
            (cb: ICallback<EQueueType>) =>
              _getQueueProperties(client, queueParams, (err, properties) => {
                if (err) cb(err);
                else if (!properties) cb(new CallbackEmptyReplyError());
                else cb(null, properties.queueType);
              }),
            (queueType: EQueueType, cb: ICallback<number>) => {
              if (queueType === EQueueType.PRIORITY_QUEUE) {
                const priorityQueueMessages = new PriorityQueueMessages();
                priorityQueueMessages.countMessages(queue, cb);
              } else {
                const queuePendingMessages = new LinearQueueMessages();
                queuePendingMessages.countMessages(queue, cb);
              }
            },
            (pending: number, cb: ICallback<number>) => {
              count.pending = pending;
              const queueDeadLetteredMessages = new QueueDeadLetteredMessages();
              queueDeadLetteredMessages.countMessages(queue, cb);
            },
            (deadLettered: number, cb: ICallback<number>) => {
              count.deadLettered = deadLettered;
              const queueAcknowledgedMessages = new QueueAcknowledgedMessages();
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

  deleteMessagesByIds(ids: string[], cb: ICallback<void>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _deleteMessage(client, ids, cb);
    });
  }

  deleteMessageById(id: string, cb: ICallback<void>): void {
    this.deleteMessagesByIds([id], cb);
  }
}
