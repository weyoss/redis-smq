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

test('Health check: case 6', async () => {
  const consumer1 = bluebird.promisifyAll(new Consumer());
  const consumer2 = bluebird.promisifyAll(new Consumer());
  const consumer3 = bluebird.promisifyAll(new Consumer());
  const consumer4 = bluebird.promisifyAll(new Consumer());

  await consumer1.run();
  await consumer2.run();

  await Promise.all([
    consumer1.run(),
    consumer2.run(),
    consumer3.run(),
    consumer4.run(),
  ]);

  await consumer1.shutdown();
  await consumer2.shutdown();

  await Promise.all([
    consumer1.shutdown(),
    consumer2.shutdown(),
    consumer3.shutdown(),
    consumer4.shutdown(),
  ]);
});
