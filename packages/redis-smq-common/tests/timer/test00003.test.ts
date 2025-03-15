/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { Timer } from '../../src/timer/timer.js';

it('Timer.setInterval() always blocks Timer.setTimeout()', async () => {
  const ticker = new Timer();
  const r = ticker.setInterval(() => void 0, 5000);
  expect(r).toBe(true);

  const r2 = ticker.setTimeout(() => void 0, 1000);
  expect(r2).toBe(false);

  ticker.reset();
});
