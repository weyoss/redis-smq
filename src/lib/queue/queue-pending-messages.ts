import {
  EQueueType,
  IQueueMessages,
  IQueueMessagesPage,
  IQueueParams,
} from '../../../types';
import { PriorityQueueMessages } from './priority-queue-messages';
import { LinearQueueMessages } from './linear-queue-messages';
import { errors, ICallback } from 'redis-smq-common';
import { Message } from '../message/message';
import { _getQueueProperties } from './queue/_get-queue-properties';
import { _getQueueParams } from './queue/_get-queue-params';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class QueuePendingMessages implements IQueueMessages {
  protected priorityQueueMessages: PriorityQueueMessages;
  protected linearQueueMessages: LinearQueueMessages;

  constructor() {
    this.priorityQueueMessages = new PriorityQueueMessages();
    this.linearQueueMessages = new LinearQueueMessages();
  }

  protected getQueueImplementation(
    queue: string | IQueueParams,
    cb: ICallback<IQueueMessages>,
  ): void {
    const queueParams = _getQueueParams(queue);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        _getQueueProperties(client, queueParams, (err, properties) => {
          if (err) cb(err);
          else if (!properties) cb(new errors.EmptyCallbackReplyError());
          else if (properties.queueType === EQueueType.PRIORITY_QUEUE) {
            cb(null, this.priorityQueueMessages);
          } else {
            cb(null, this.linearQueueMessages);
          }
        });
      }
    });
  }

  countMessages(queue: string | IQueueParams, cb: ICallback<number>): void {
    this.getQueueImplementation(queue, (err, pendingMessages) => {
      if (err) cb(err);
      else pendingMessages?.countMessages(queue, cb);
    });
  }

  getMessages(
    queue: string | IQueueParams,
    cursor: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<Message>>,
  ): void {
    this.getQueueImplementation(queue, (err, pendingMessages) => {
      if (err) cb(err);
      else pendingMessages?.getMessages(queue, cursor, pageSize, cb);
    });
  }

  deleteMessage(
    queue: string | IQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.getQueueImplementation(queue, (err, pendingMessages) => {
      if (err) cb(err);
      else pendingMessages?.deleteMessage(queue, messageId, cb);
    });
  }

  purge(queue: string | IQueueParams, cb: ICallback<void>): void {
    this.getQueueImplementation(queue, (err, pendingMessages) => {
      if (err) cb(err);
      else pendingMessages?.purge(queue, cb);
    });
  }
}
