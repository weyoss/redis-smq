/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeQueuePolicy, IExchangeParams, RedisSMQ } from 'redis-smq';

export async function createFanoutExchange(name: string | IExchangeParams) {
  const exchange = RedisSMQ.createFanoutExchange();
  await exchange.create(name, EExchangeQueuePolicy.STANDARD);
  return name;
}

export async function createDirectExchange(name: string | IExchangeParams) {
  const exchange = RedisSMQ.createDirectExchange();
  await exchange.create(name, EExchangeQueuePolicy.STANDARD);
  return name;
}

export async function createTopicExchange(name: string | IExchangeParams) {
  const exchange = RedisSMQ.createTopicExchange();
  await exchange.create(name, EExchangeQueuePolicy.STANDARD);
  return name;
}
