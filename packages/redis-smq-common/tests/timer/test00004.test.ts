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

it('Timer.setTimeout() should block Timer.setInterval() when not fired', async () => {
  const ticker = new Timer();
  const r = ticker.setTimeout(() => void 0, 5000);
  expect(r).toBe(true);

  const r2 = ticker.setInterval(() => void 0, 1000);
  expect(r2).toBe(false);

  await bluebird.delay(10000);

  const r3 = ticker.setInterval(() => void 0, 1000);
  expect(r3).toBe(true);
  ticker.reset();
});
