/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TQueueExtendedParams } from '../../../queue-manager/index.js';
import { ICallback } from 'redis-smq-common';
import { IMessageTransferable } from '../../../message/index.js';

export interface IMessageBrowser {
  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void;

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void;

  purge(queue: TQueueExtendedParams, cb: ICallback): void;
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
