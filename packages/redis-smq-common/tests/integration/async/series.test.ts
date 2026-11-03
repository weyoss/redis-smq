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

function runSeries(tasks: Array<(cb: ICallback<void>) => void>): Promise<void> {
  return new Promise((resolve, reject) => {
    async.series(tasks, (err) => (err ? reject(err) : resolve()));
  });
}

describe('async.series', () => {
  it("runs tasks sequentially — each task sees the previous task's effect", async () => {
    let count = 0;
    await runSeries([
      (cb) => {
        expect(count).toBe(0);
        count += 1;
        cb();
      },
      (cb) => {
        expect(count).toBe(1);
        count += 1;
        cb();
      },
      (cb) => {
        expect(count).toBe(2);
        count += 1;
        cb();
      },
    ]);
    expect(count).toBe(3);
  });

  it('stops on the first error — later tasks are not invoked', async () => {
    let count = 0;
    await expect(
      runSeries([
        (cb) => {
          expect(count).toBe(0);
          count += 1;
          cb();
        },
        (cb) => {
          cb(new Error('explicit error'));
        },
        (cb) => {
          // Never runs.
          cb();
        },
      ]),
    ).rejects.toThrow('explicit error');
    expect(count).toBe(1);
  });
});
