/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ExchangeDirect } from '../../src/lib/exchange/exchange-direct';
import { ExchangeTopic } from '../../src/lib/exchange/exchange-topic';
import { ExchangeFanOut } from '../../src/lib/exchange/exchange-fan-out';
import { IQueueParams } from '../queue';

export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

export type TTopicParams = {
  topic: string;
  ns: string;
};

export type TExchangeDirectBindingParams = IQueueParams | string;
export type TExchangeTopicBindingParams = TTopicParams | string;
export type TExchangeFanOutBindingParams = string;

export type TExchange = ExchangeDirect | ExchangeTopic | ExchangeFanOut;

export type TExchangeSerialized =
  | ReturnType<ExchangeDirect['toJSON']>
  | ReturnType<ExchangeTopic['toJSON']>
  | ReturnType<ExchangeFanOut['toJSON']>;
