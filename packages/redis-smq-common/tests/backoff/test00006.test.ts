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
import { getDummyLogger } from '../../src/logger/index.js';

describe('Backoff: error handling', () => {
  it('should handle non-operational state', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));
    await backoff.runAsync();

    // Simulate non-operational
    vi.spyOn(backoff, 'isOperational').mockReturnValue(false);

    const task = vi.fn();

    await expect(backoff.executeAsync(task)).rejects.toThrow(
      'Backoff instance is not operational',
    );

    expect(task).not.toHaveBeenCalled();

    await backoff.shutdownAsync();
  });
});
