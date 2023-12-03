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

export type TExchangeDirectBindingParams = IQueueParams | string;

export type TExchangeFanOutBindingParams = string;

export type TExchangeTopicBindingParams = TTopicParams | string;

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

export type TExchangeDirectSerialized = IExchangeSerialized<
  TExchangeDirectBindingParams,
  EExchangeType.DIRECT
>;

export type TExchangeTopicSerialized = IExchangeSerialized<
  TExchangeTopicBindingParams,
  EExchangeType.TOPIC
>;

export type TExchangeFanOutSerialized = IExchangeSerialized<
  TExchangeFanOutBindingParams,
  EExchangeType.FANOUT
>;

export type TExchangeDirect = IExchange<
  TExchangeDirectBindingParams,
  EExchangeType.DIRECT
>;

export type TExchangeTopic = IExchange<
  TExchangeTopicBindingParams,
  EExchangeType.TOPIC
>;

export type TExchangeFanOut = IExchange<
  TExchangeFanOutBindingParams,
  EExchangeType.FANOUT
>;

export type TExchange = TExchangeDirect | TExchangeTopic | TExchangeFanOut;

export type TExchangeSerialized =
  | TExchangeDirectSerialized
  | TExchangeTopicSerialized
  | TExchangeFanOutSerialized;
