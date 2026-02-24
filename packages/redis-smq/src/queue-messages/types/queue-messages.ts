/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IQueueGroupConsumersPendingCount {
  [key: string]: number;
}

export interface IQueueMessagesCount {
  acknowledged: number;
  deadLettered: number;
  pending: number | IQueueGroupConsumersPendingCount;
  scheduled: number;
}
