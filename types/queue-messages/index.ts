/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams, TQueueExtendedParams } from '../queue';
import { IConsumableMessage } from '../message';

export interface IQueueMessages {
  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void;
  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<IConsumableMessage>>,
  ): void;
  purge(queue: TQueueExtendedParams, cb: ICallback<void>): void;
}

export interface IQueueGroupConsumersPendingCount {
  [key: string]: number;
}

export interface IQueueMessagesCount {
  acknowledged: number;
  deadLettered: number;
  pending: number | IQueueGroupConsumersPendingCount;
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

export type TQueueMessagesParams = {
  queue: string | IQueueParams;
  consumerGroupId?: string | null;
};

export type TQueueMessagesPaginationParams = {
  queue: string | IQueueParams;
  page: number;
  pageSize: number;
  consumerGroupId?: string | null;
};

export interface IQueueMessagesRequeuable {
  requeueMessage(
    queue: string | IQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void;
}
