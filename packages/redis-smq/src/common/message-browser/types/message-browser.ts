/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TQueueExtendedParams } from '../../../queue-manager/index.js';
import { ICallback } from 'redis-smq-common';
import { IMessageTransferable } from '../../../message/index.js';
import { EQueueMessageType } from '../../queue-messages-registry/types/queue-messages-registry.js';

export interface IMessageBrowser {
  readonly messageType: EQueueMessageType;

  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void;

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void;

  getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void;

  purge(queue: TQueueExtendedParams, cb: ICallback<string>): void;

  cancelPurge(queue: TQueueExtendedParams, jobId: string, cb: ICallback): void;
}

export interface IBrowserPage<T> {
  totalItems: number;
  items: T[];
}

export interface IBrowserPageInfo {
  pageSize: number;
  currentPage: number;
  offsetStart: number;
  offsetEnd: number;
  totalPages: number;
}
