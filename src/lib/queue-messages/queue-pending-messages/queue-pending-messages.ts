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
  logger,
} from 'redis-smq-common';
import { RedisClientInstance } from '../../../common/redis-client/redis-client-instance.js';
import { Configuration } from '../../../config/index.js';
import { IMessageTransferable } from '../../message/index.js';
import { _getQueueProperties } from '../../queue/_/_get-queue-properties.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import {
  EQueueType,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../queue/index.js';
import { IQueueMessages, IQueueMessagesPage } from '../types/index.js';
import { LinearQueuePendingMessages } from './linear-queue-pending-messages.js';
import { PriorityQueuePendingMessages } from './priority-queue-pending-messages.js';

export class QueuePendingMessages implements IQueueMessages {
  protected redisClient;
  protected logger;
  protected priorityQueueMessages;
  protected linearQueuePendingMessages;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `queue-pending-messages`,
    );
    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));

    this.priorityQueueMessages = new PriorityQueuePendingMessages();
    this.linearQueuePendingMessages = new LinearQueuePendingMessages();
  }

  protected getQueueImplementation(
    queue: IQueueParsedParams,
    cb: ICallback<IQueueMessages>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
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

  shutdown = (cb: ICallback<void>): void => {
    async.waterfall(
      [
        (cb: ICallback<void>) => this.priorityQueueMessages.shutdown(cb),
        (cb: ICallback<void>) => this.linearQueuePendingMessages.shutdown(cb),
        this.redisClient.shutdown,
      ],
      cb,
    );
  };
}
