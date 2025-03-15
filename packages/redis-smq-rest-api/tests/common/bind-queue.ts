/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ExchangeFanOut, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export async function bindQueue(queue: IQueueParams, fanOut: string) {
  const exchange = promisifyAll(new ExchangeFanOut());
  await exchange.bindQueueAsync(queue, fanOut);
  await exchange.shutdownAsync();
}
