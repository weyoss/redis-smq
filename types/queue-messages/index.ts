/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { MessageEnvelope } from '../../src/lib/message/message-envelope';
import { IQueueParams } from '../queue';

export interface IQueueMessages {
  countMessages(queue: string | IQueueParams, cb: ICallback<number>): void;
  getMessages(
    queue: string | IQueueParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<MessageEnvelope>>,
  ): void;
  purge(queue: string | IQueueParams, cb: ICallback<void>): void;
}

export interface IQueueMessagesCount {
  acknowledged: number;
  deadLettered: number;
  pending: number;
  scheduled: number;
}

export interface IQueueMessagesPage<T> {
  totalItems: number;
  cursor: number;
  items: T[];
}

export type IQueueMessagesPageParams = {
  currentPage: number;
  offsetStart: number;
  offsetEnd: number;
  totalPages: number;
};
