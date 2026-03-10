/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import { Timer } from '../../src/timer/timer.js';
import { getDummyLogger } from '../../src/logger/index.js';

it('Timer.setTimeout()', async () => {
  let count = 0;
  const timer = bluebird.promisifyAll(new Timer(getDummyLogger()));

  const r = timer.schedule(() => (count += 1), 5000);
  expect(r).toBe(false);

  await timer.runAsync();

  const r1 = timer.schedule(() => (count += 1), 5000);
  expect(r1).toBe(true);

  const r2 = timer.schedule(() => (count += 1), 1000);
  expect(r2).toBe(false);

  await bluebird.delay(10000);

  expect(count).toBe(1);

  const r3 = timer.schedule(() => (count += 1), 5000);
  expect(r3).toBe(true);
  timer.reset();

  await bluebird.delay(10000);

  expect(count).toBe(1);

  const r4 = timer.schedule(() => (count += 1), 5000);
  expect(r4).toBe(true);

  const r5 = timer.schedule(() => (count += 1), 60000);
  expect(r5).toBe(false);

  timer.reset();

  const r6 = timer.schedule(() => (count += 1), 5000);
  expect(r6).toBe(true);

  timer.reset();
});
