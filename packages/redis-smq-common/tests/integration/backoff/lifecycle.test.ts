/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import bluebird from 'bluebird';
import type { ICallback } from '../../../src/async/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { TestBackoff } from './common/test-backoff.js';

const NOT_OPERATIONAL = 'Backoff instance is not operational';

describe('Backoff: lifecycle', () => {
  it('transitions isRunning() true → false across run/shutdown', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));

    await backoff.runAsync();
    expect(backoff.isRunning()).toBe(true);

    await backoff.shutdownAsync();
    expect(backoff.isRunning()).toBe(false);
  });

  it('rejects execute() before run()', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));
    const task = vi.fn((cb: ICallback<string>) => cb(null, 'success'));

    await expect(backoff.executeAsync(task)).rejects.toThrow(NOT_OPERATIONAL);
    expect(task).not.toHaveBeenCalled();
  });

  it('rejects execute() when isOperational() is false', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));
    await backoff.runAsync();

    vi.spyOn(backoff, 'isOperational').mockReturnValue(false);
    const task = vi.fn();

    await expect(backoff.executeAsync(task)).rejects.toThrow(NOT_OPERATIONAL);
    expect(task).not.toHaveBeenCalled();

    await backoff.shutdownAsync();
  });
});
