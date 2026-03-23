/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from 'vitest';
import bluebird from 'bluebird';
import { Consumer } from '../../../src/index.js';

test('Health check: case 4', async () => {
  const consumer1 = bluebird.promisifyAll(new Consumer());
  await consumer1.run();

  const consumer2 = bluebird.promisifyAll(new Consumer());
  await consumer2.run();

  const consumer3 = bluebird.promisifyAll(new Consumer());
  await consumer3.run();

  const consumer4 = bluebird.promisifyAll(new Consumer());
  await consumer4.run();

  await consumer1.shutdown();
  await consumer2.shutdown();
  await consumer3.shutdown();
  await consumer4.shutdown();
});
