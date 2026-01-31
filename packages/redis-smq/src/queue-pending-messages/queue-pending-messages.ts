/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IMessageTransferable } from '../message/index.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import {
  EBackgroundJobStatus,
  EQueueMessageType,
  IBackgroundJob,
  IBrowserPage,
  IMessageBrowser,
} from '../common/index.js';
import { withPendingMessages } from './helpers/with-pending-messages.js';
import { TPurgeQueueJobTarget } from '../redis-smq/index.js';

export class QueuePendingMessages implements IMessageBrowser {
  readonly messageType = EQueueMessageType.PENDING;

  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.countMessages(queue, cb);
      },
      cb,
    );
  }

  getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.getMessageIds(queue, page, pageSize, cb);
      },
      cb,
    );
  }

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.getMessages(queue, page, pageSize, cb);
      },
      cb,
    );
  }

  purge(queue: TQueueExtendedParams, cb: ICallback<string>): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.purge(queue, cb);
      },
      cb,
    );
  }

  cancelPurge(queue: TQueueExtendedParams, jobId: string, cb: ICallback): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.cancelPurge(queue, jobId, cb);
      },
      cb,
    );
  }

  getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.getPurgeJob(queue, jobId, cb);
      },
      cb,
    );
  }

  getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void {
    withPendingMessages(
      queue,
      (pendingMessages, cb) => {
        pendingMessages.getPurgeJobStatus(queue, jobId, cb);
      },
      cb,
    );
  }
}
