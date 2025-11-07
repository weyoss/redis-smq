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
  ExchangeDirect,
  ExchangeFanout,
  ExchangeTopic,
  IExchangeParams,
  IQueueParams,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export async function bindQueueFanout(
  queue: IQueueParams,
  fanout: string | IExchangeParams,
) {
  const exchange = promisifyAll(new ExchangeFanout());
  await exchange.bindQueueAsync(queue, fanout);
}

export async function bindQueueDirect(
  queue: IQueueParams,
  direct: string | IExchangeParams,
  routingKey: string,
) {
  const exchange = promisifyAll(new ExchangeDirect());
  await exchange.bindQueueAsync(queue, direct, routingKey);
}

export async function bindQueueTopic(
  queue: IQueueParams,
  topic: string | IExchangeParams,
  bindingPattern: string,
) {
  const exchange = promisifyAll(new ExchangeTopic());
  await exchange.bindQueueAsync(queue, topic, bindingPattern);
}
