/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import bluebird from 'bluebird';

describe('Consumer throughput benchmark', () => {
  it('should run the benchmark and report benchmark result upon completion', async () => {
    const logSpy = vi.spyOn(console, 'log');

    process.env.NODE_ENV = 'development';
    process.env.BENCH_CONSUMERS = '1';
    process.env.BENCH_MESSAGES = '1';

    import('../index.js');

    await bluebird.delay(5000);

    const output = logSpy.mock.calls.reduce((a, call) => {
      return a.concat(call[0]);
    }, '');

    expect(output).toContain('========== BENCHMARK COMPLETE ==========');
    expect(output).toContain('Total messages consumed: 1');
    expect(output).toContain('Total time:');
    expect(output).toContain('Overall throughput:');
  });
});
