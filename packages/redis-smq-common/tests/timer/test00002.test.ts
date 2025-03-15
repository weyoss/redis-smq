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

it('Timer.setInterval()', async () => {
  let count = 0;
  const ticker = new Timer();
  const r = ticker.setInterval(() => (count += 1), 5000);
  expect(r).toBe(true);

  const r2 = ticker.setInterval(() => (count += 1), 1000);
  expect(r2).toBe(false);

  await bluebird.delay(5000);

  expect(count).toBe(1);

  const r3 = ticker.setInterval(() => (count += 1), 5000);
  expect(r3).toBe(false);

  await bluebird.delay(15000);

  expect(count).toBeGreaterThan(2);
  ticker.reset();

  const r4 = ticker.setInterval(() => (count += 1), 5000);
  expect(r4).toBe(true);

  ticker.reset();
});
