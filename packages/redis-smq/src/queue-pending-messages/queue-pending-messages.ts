/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
} from 'redis-smq-common';
import { Configuration } from '../config/index.js';
import { IMessageTransferable } from '../message/index.js';
import { _getQueueProperties } from '../queue-manager/_/_get-queue-properties.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';
import {
  EQueueType,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../queue-manager/index.js';
import { IPaginationPage, IQueueExplorer } from '../common/index.js';
import { SequentialQueuePendingMessages } from './sequential-queue-pending-messages.js';
import { PriorityQueuePendingMessages } from './priority-queue-pending-messages.js';
import { withSharedPoolConnection } from '../common/redis-connection-pool/with-shared-pool-connection.js';

export class QueuePendingMessages implements IQueueExplorer {
  protected priorityQueueMessages;
  protected sequentialQueuePendingMessages;
  protected logger;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.priorityQueueMessages = new PriorityQueuePendingMessages();
    this.sequentialQueuePendingMessages = new SequentialQueuePendingMessages();
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

  protected getQueueImplementation(
    queue: IQueueParsedParams,
    cb: ICallback<IQueueExplorer>,
  ): void {
    withSharedPoolConnection(
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
}
