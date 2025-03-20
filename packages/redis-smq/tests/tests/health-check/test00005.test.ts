/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from 'vitest';
import bluebird from 'bluebird';
import { Consumer } from '../../../src/lib/index.js';

test('Health check: case 5', async () => {
  const consumer1 = bluebird.promisifyAll(new Consumer());
  const consumer2 = bluebird.promisifyAll(new Consumer());
  const consumer3 = bluebird.promisifyAll(new Consumer());
  const consumer4 = bluebird.promisifyAll(new Consumer());

  await Promise.all([
    consumer1.runAsync(),
    consumer2.runAsync(),
    consumer3.runAsync(),
    consumer4.runAsync(),
  ]);

  await Promise.all([
    consumer1.shutdownAsync(),
    consumer2.shutdownAsync(),
    consumer3.shutdownAsync(),
    consumer4.shutdownAsync(),
  ]);
});
