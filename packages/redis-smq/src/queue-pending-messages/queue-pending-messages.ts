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
  withRedisClient,
} from 'redis-smq-common';
import { RedisClient } from '../common/redis-client/redis-client.js';
import { Configuration } from '../config/index.js';
import { IMessageTransferable } from '../message/index.js';
import { _getQueueProperties } from '../queue/_/_get-queue-properties.js';
import { _parseQueueExtendedParams } from '../queue/_/_parse-queue-extended-params.js';
import {
  EQueueType,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../queue/index.js';
import { IQueueExplorer, IPaginationPage } from '../common/index.js';
import { SequentialQueuePendingMessages } from './sequential-queue-pending-messages.js';
import { PriorityQueuePendingMessages } from './priority-queue-pending-messages.js';

export class QueuePendingMessages implements IQueueExplorer {
  protected redisClient;
  protected priorityQueueMessages;
  protected sequentialQueuePendingMessages;
  protected logger;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.priorityQueueMessages = new PriorityQueuePendingMessages();
    this.sequentialQueuePendingMessages = new SequentialQueuePendingMessages();
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  protected getQueueImplementation(
    queue: IQueueParsedParams,
    cb: ICallback<IQueueExplorer>,
  ): void {
    withRedisClient(
      this.redisClient,
      (client, cb) =>
        _getQueueProperties(client, queue.queueParams, (err, properties) => {
          if (err) cb(err);
          else if (!properties) cb(new CallbackEmptyReplyError());
          else if (properties.queueType === EQueueType.PRIORITY_QUEUE) {
            cb(null, this.priorityQueueMessages);
          } else {
            cb(null, this.sequentialQueuePendingMessages);
          }
        }),
      cb,
    );
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
    cb: ICallback<IPaginationPage<IMessageTransferable>>,
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
    async.series(
      [
        (cb: ICallback<void>) => this.priorityQueueMessages.shutdown(cb),
        (cb: ICallback<void>) =>
          this.sequentialQueuePendingMessages.shutdown(cb),
        this.redisClient.shutdown,
      ],
      (err) => cb(err),
    );
  };
}
