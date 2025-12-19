/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { async } from '../../src/async/async.js';
import { ICallback } from '../../src/async/index.js';

it('async.series: error handling', async () => {
  let count = 0;
  const p = new Promise<void>((resolve, reject) => {
    async.series(
      [
        (cb: ICallback<void>) => {
          expect(count).toBe(0);
          count += 1;
          cb();
        },
        (cb: ICallback<void>) => {
          cb(new Error('explicit error'));
        },
        (cb: ICallback<void>) => {
          expect(count).toBe(2);
          count += 1;
          cb();
        },
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
  await expect(p).rejects.toThrow('explicit error');
  expect(count).toBe(1);
});
