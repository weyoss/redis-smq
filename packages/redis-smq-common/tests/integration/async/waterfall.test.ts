/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { async } from '../../../src/async/async.js';
import type { ICallback } from '../../../src/async/index.js';

/**
 * `async.waterfall` is typed with fixed-arity tuple overloads, so a plain
 * `Array<…>` doesn't satisfy any of them. The runtime implementation accepts
 * arrays of any length — the cast preserves that contract for the tests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runWaterfall<T>(tasks: Array<(...args: any[]) => void>): Promise<T> {
  return new Promise((resolve, reject) => {
    async.waterfall(tasks as never, (err, result) =>
      err ? reject(err) : resolve(result as T),
    );
  });
}

describe('async.waterfall', () => {
  it('passes results from one task to the next', async () => {
    const result = await runWaterfall<number>([
      (cb: ICallback<number>) => cb(null, 1),
      (n: number, cb: ICallback<number>) => {
        expect(n).toBe(1);
        cb(null, n + 1);
      },
      (n: number, cb: ICallback<number>) => {
        expect(n).toBe(2);
        cb(null, n + 1);
      },
    ]);
    expect(result).toBe(3);
  });

  it('stops on the first error and propagates it', async () => {
    const p = runWaterfall([
      (cb: ICallback<number>) => cb(null, 1),
      (_n: number, cb: ICallback<number>) => cb(new Error('explicit error')),
      (_n: number, cb: ICallback<number>) => cb(null, 3), // never runs
    ]);
    await expect(p).rejects.toThrow('explicit error');
  });

  it('invokes the callback immediately when the tasks array is empty', async () => {
    await expect(runWaterfall([])).resolves.toBeUndefined();
  });
});
