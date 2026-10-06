/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IExchangeParams, IQueueParams, RedisSMQ } from 'redis-smq';

export async function bindQueueFanout(
  queue: IQueueParams,
  fanout: string | IExchangeParams,
) {
  const exchange = RedisSMQ.createFanoutExchange();
  await exchange.bindQueue(queue, fanout);
}

export async function bindQueueDirect(
  queue: IQueueParams,
  direct: string | IExchangeParams,
  routingKey: string,
) {
  const exchange = RedisSMQ.createDirectExchange();
  await exchange.bindQueue(queue, direct, routingKey);
}

export async function bindQueueTopic(
  queue: IQueueParams,
  topic: string | IExchangeParams,
  bindingPattern: string,
) {
  const exchange = RedisSMQ.createTopicExchange();
  await exchange.bindQueue(queue, topic, bindingPattern);
}
