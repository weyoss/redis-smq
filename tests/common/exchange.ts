/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { ExchangeFanOut } from '../../src/lib/exchange/exchange-fan-out';
import {
  TExchangeDirectBindingParams,
  TExchangeFanOutBindingParams,
  TExchangeTopicBindingParams,
} from '../../types';
import { ExchangeTopic } from '../../src/lib/exchange/exchange-topic';
import { ExchangeDirect } from '../../src/lib/exchange/exchange-direct';

export function getFanOutExchange(bindingParams: TExchangeFanOutBindingParams) {
  return promisifyAll(new ExchangeFanOut(bindingParams));
}

export function getTopicExchange(bindingParams: TExchangeTopicBindingParams) {
  return promisifyAll(new ExchangeTopic(bindingParams));
}

export function getDirectExchange(bindingParams: TExchangeDirectBindingParams) {
  return promisifyAll(new ExchangeDirect(bindingParams));
}
