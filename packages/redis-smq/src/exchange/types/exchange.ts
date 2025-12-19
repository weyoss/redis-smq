/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

export enum EExchangeQueuePolicy {
  STANDARD, // only FIFO/LIFO queues
  PRIORITY, // only priority queues
}

export enum EExchangeProperty {
  TYPE = 0,
  QUEUE_POLICY,
}

export interface IExchangeParams {
  name: string;
  ns: string;
}

export interface IExchangeParsedParams extends IExchangeParams {
  type: EExchangeType;
}

export interface IExchangeProperties {
  type: EExchangeType;
  queuePolicy: EExchangeQueuePolicy;
}
