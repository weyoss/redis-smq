/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import { Timer } from '../../src/timer/timer.js';

it('Timer.setTimeout()', async () => {
  let count = 0;
  const ticker = new Timer();
  const r = ticker.setTimeout(() => (count += 1), 5000);
  expect(r).toBe(true);

  const r2 = ticker.setTimeout(() => (count += 1), 1000);
  expect(r2).toBe(false);

  await bluebird.delay(10000);

  expect(count).toBe(1);

  const r3 = ticker.setTimeout(() => (count += 1), 5000);
  expect(r3).toBe(true);
  ticker.reset();

  await bluebird.delay(10000);

  expect(count).toBe(1);
  const r4 = ticker.setTimeout(() => (count += 1), 5000);
  expect(r4).toBe(true);

  const r5 = ticker.setTimeout(() => (count += 1), 60000);
  expect(r5).toBe(false);

  ticker.reset();

  const r6 = ticker.setTimeout(() => (count += 1), 5000);
  expect(r6).toBe(true);

  ticker.reset();
});
