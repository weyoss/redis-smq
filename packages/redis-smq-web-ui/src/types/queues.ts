/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IQueueParams {
  name: string;
  ns: string;
}

export enum EQueueDeliveryModel {
  POINT_TO_POINT,
  PUB_SUB,
}

export enum EQueueType {
  LIFO_QUEUE,
  FIFO_QUEUE,
  PRIORITY_QUEUE,
}
