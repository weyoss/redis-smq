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
  TExchangeDirectExchangeBindingParams,
  TExchangeFanOutExchangeBindingParams,
  TExchangeTopicExchangeBindingParams,
} from '../../types';
import { ExchangeTopic } from '../../src/lib/exchange/exchange-topic';
import { ExchangeDirect } from '../../src/lib/exchange/exchange-direct';

export function getFanOutExchange(
  bindingParams: TExchangeFanOutExchangeBindingParams,
) {
  return promisifyAll(new ExchangeFanOut(bindingParams));
}

export function getTopicExchange(
  bindingParams: TExchangeTopicExchangeBindingParams,
) {
  return promisifyAll(new ExchangeTopic(bindingParams));
}

export function getDirectExchange(
  bindingParams: TExchangeDirectExchangeBindingParams,
) {
  return promisifyAll(new ExchangeDirect(bindingParams));
}
