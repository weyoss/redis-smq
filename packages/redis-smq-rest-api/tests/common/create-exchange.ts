/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  EExchangeQueuePolicy,
  ExchangeDirect,
  ExchangeFanout,
  ExchangeTopic,
  IExchangeParams,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export async function createFanoutExchange(name: string | IExchangeParams) {
  const exchange = promisifyAll(new ExchangeFanout());
  await exchange.createAsync(name, EExchangeQueuePolicy.STANDARD);
  return name;
}

export async function createDirectExchange(name: string | IExchangeParams) {
  const exchange = promisifyAll(new ExchangeDirect());
  await exchange.createAsync(name, EExchangeQueuePolicy.STANDARD);
  return name;
}

export async function createTopicExchange(name: string | IExchangeParams) {
  const exchange = promisifyAll(new ExchangeTopic());
  await exchange.createAsync(name, EExchangeQueuePolicy.STANDARD);
  return name;
}
