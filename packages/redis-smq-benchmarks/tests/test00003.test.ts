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

describe('E2E throughput benchmark', () => {
  it('should run the benchmark and report benchmark result upon completion', async () => {
    const logSpy = vi.spyOn(console, 'log');

    process.env.NODE_ENV = 'development';
    process.env.BENCH_PRODUCERS = '5';
    process.env.BENCH_CONSUMERS = '10';
    process.env.BENCH_MESSAGES = '100';

    import('../index.js');

    await bluebird.delay(15000);

    const output = logSpy.mock.calls.reduce((a, call) => {
      return a.concat(call[0]);
    }, '');

    expect(output).toContain('========== E2E BENCHMARK COMPLETE ==========');
    expect(output).toContain('Production Phase:');
    expect(output).toContain('Total produced: 100');
    expect(output).toContain('Production time:');
    expect(output).toContain('Production throughput:');

    expect(output).toContain('Consumption Phase:');
    expect(output).toContain('Total consumed: 100');
    expect(output).toContain('Consumption time:');
    expect(output).toContain('Consumption throughput:');

    expect(output).toContain('End-to-End:');
    expect(output).toContain('Total time:');
    expect(output).toContain('Overall throughput:');
    expect(output).toContain('System backlog:');
    expect(output).toContain('Status: All messages processed successfully');
  });
});
