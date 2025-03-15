/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../queue/index.js';

export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

export interface ITopicParams {
  topic: string;
  ns: string;
}

export type TExchangeDirectTransferable = {
  type: EExchangeType.DIRECT;
  params: IQueueParams;
  exchangeTag: string;
};

export type TExchangeTopicTransferable = {
  type: EExchangeType.TOPIC;
  params: ITopicParams;
  exchangeTag: string;
};

export type TExchangeFanOutTransferable = {
  type: EExchangeType.FANOUT;
  params: string;
  exchangeTag: string;
};

export type TExchangeTransferable =
  | TExchangeDirectTransferable
  | TExchangeTopicTransferable
  | TExchangeFanOutTransferable;

export interface IExchange<ExchangeParams> {
  getQueues(
    exchangeParams: ExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
}
