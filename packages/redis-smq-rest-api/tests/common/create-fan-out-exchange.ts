/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ExchangeFanOut } from 'redis-smq';

const { promisifyAll } = bluebird;

export async function createFanOutExchange(name: string) {
  const exchangeFanOut = promisifyAll(new ExchangeFanOut());
  await exchangeFanOut.saveExchangeAsync(name);
  await exchangeFanOut.shutdownAsync();
  return name;
}
