/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../queue';
import { ICallback } from 'redis-smq-common';

export type TTopicParams = {
  topic: string;
  ns: string;
};

export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

export type TExchangeDirectExchangeBindingParams = IQueueParams | string;

export type TExchangeFanOutExchangeBindingParams = string;

export type TExchangeTopicExchangeBindingParams = TTopicParams | string;

export interface IExchange<BindingParams, ExchangeType extends EExchangeType>
  extends IExchangeSerialized<BindingParams, ExchangeType> {
  toJSON(): IExchangeSerialized<BindingParams, ExchangeType>;
  getQueues(cb: ICallback<IQueueParams[]>): void;
  getBindingParams(): BindingParams;
}

export interface IExchangeSerialized<
  BindingParams,
  ExchangeType extends EExchangeType,
> {
  readonly type: ExchangeType;
  readonly bindingParams: BindingParams;
  readonly exchangeTag: string;
}

export type TExchangeDirectExchange = IExchange<
  TExchangeDirectExchangeBindingParams,
  EExchangeType.DIRECT
>;

export type TExchangeTopicExchange = IExchange<
  TExchangeTopicExchangeBindingParams,
  EExchangeType.TOPIC
>;

export type TExchangeFanOutExchange = IExchange<
  TExchangeFanOutExchangeBindingParams,
  EExchangeType.FANOUT
>;

export type TExchange =
  | TExchangeDirectExchange
  | TExchangeTopicExchange
  | TExchangeFanOutExchange;

export type TExchangeSerialized = ReturnType<TExchange['toJSON']>;
