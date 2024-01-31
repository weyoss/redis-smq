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
  IMessageTransferable,
  IQueueMessages,
  IQueueMessagesPage,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../../../types';
import { PriorityQueuePendingMessages } from './priority-queue-pending-messages';
import { LinearQueuePendingMessages } from './linear-queue-pending-messages';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getQueueProperties } from '../queue/_get-queue-properties';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _parseQueueExtendedParams } from '../queue/_parse-queue-extended-params';

export class QueuePendingMessages implements IQueueMessages {
  protected priorityQueueMessages: PriorityQueuePendingMessages;
  protected linearQueuePendingMessages: LinearQueuePendingMessages;

  constructor() {
    this.priorityQueueMessages = new PriorityQueuePendingMessages();
    this.linearQueuePendingMessages = new LinearQueuePendingMessages();
  }

  protected getQueueImplementation(
    queue: IQueueParsedParams,
    cb: ICallback<IQueueMessages>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        _getQueueProperties(client, queue.queueParams, (err, properties) => {
          if (err) cb(err);
          else if (!properties) cb(new CallbackEmptyReplyError());
          else if (properties.queueType === EQueueType.PRIORITY_QUEUE) {
            cb(null, this.priorityQueueMessages);
          } else {
            cb(null, this.linearQueuePendingMessages);
          }
        });
      }
    });
  }

  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) cb(parsedParams);
    else {
      this.getQueueImplementation(parsedParams, (err, pendingMessages) => {
        if (err) cb(err);
        else pendingMessages?.countMessages(queue, cb);
      });
    }
  }

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<IMessageTransferable>>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) cb(parsedParams);
    else {
      this.getQueueImplementation(parsedParams, (err, pendingMessages) => {
        if (err) cb(err);
        else pendingMessages?.getMessages(queue, page, pageSize, cb);
      });
    }
  }

  purge(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) cb(parsedParams);
    else {
      this.getQueueImplementation(parsedParams, (err, pendingMessages) => {
        if (err) cb(err);
        else pendingMessages?.purge(queue, cb);
      });
    }
  }
}
