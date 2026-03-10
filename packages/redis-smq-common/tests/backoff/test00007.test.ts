/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import { TestBackoff } from './common/test-backoff.js';
import bluebird from 'bluebird';
import { ICallback } from '../../src/async/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

describe('Backoff: runnable lifecycle', () => {
  it('should run and shutdown properly', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));

    await backoff.runAsync();
    expect(backoff.isRunning()).toBe(true);

    await backoff.shutdownAsync();
    expect(backoff.isRunning()).toBe(false);
  });

  it('should not execute when not running', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));

    // Don't call runAsync()
    const task = vi.fn((cb: ICallback<string>) => cb(null, 'success'));

    await expect(backoff.executeAsync(task)).rejects.toThrow(
      `Backoff instance is not operational`,
    );
    expect(task).not.toHaveBeenCalled();
  });
});
