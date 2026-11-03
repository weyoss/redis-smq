/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import { Timer } from '../../src/timer/timer.js';
import { getDummyLogger } from '../../src/logger/index.js';

// `setTimeout`-based scheduling — cannot use fake timers safely because
// `Timer` extends a bluebird-promisified `Runnable`. Delays are kept small.
const SCHEDULE_MS = 200;
const WAIT_MS = 400;

function makeTimer() {
  return bluebird.promisifyAll(new Timer(getDummyLogger()));
}

describe('Timer', () => {
  it('rejects schedule() before run()', () => {
    const timer = makeTimer();
    expect(timer.schedule(() => undefined, SCHEDULE_MS)).toBe(false);
  });

  it('allows only one pending timer at a time', async () => {
    const timer = makeTimer();
    await timer.runAsync();
    expect(timer.schedule(() => undefined, SCHEDULE_MS)).toBe(true);
    // Second schedule is rejected — a timer is already pending.
    expect(timer.schedule(() => undefined, 100)).toBe(false);
  });

  it('fires the scheduled callback exactly once', async () => {
    const timer = makeTimer();
    await timer.runAsync();

    let count = 0;
    expect(timer.schedule(() => (count += 1), SCHEDULE_MS)).toBe(true);
    await bluebird.delay(WAIT_MS);

    expect(count).toBe(1);
  });

  it('reset() clears the pending timer', async () => {
    const timer = makeTimer();
    await timer.runAsync();

    let count = 0;
    timer.schedule(() => (count += 1), SCHEDULE_MS);
    timer.reset();
    await bluebird.delay(WAIT_MS);

    expect(count).toBe(0);
  });

  it('allows a new schedule() after reset()', async () => {
    const timer = makeTimer();
    await timer.runAsync();

    timer.schedule(() => undefined, SCHEDULE_MS);
    timer.reset();

    expect(timer.schedule(() => undefined, SCHEDULE_MS)).toBe(true);
    timer.reset();
  });
});
