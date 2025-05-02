/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { async } from '../../src/async/async.js';
import { ICallback } from '../../src/async/index.js';

it('async.series: case 1', async () => {
  let count = 0;
  await new Promise<void>((resolve, reject) => {
    async.series(
      [
        (cb: ICallback<void>) => {
          expect(count).toBe(0);
          count += 1;
          cb();
        },
        (cb: ICallback<void>) => {
          expect(count).toBe(1);
          count += 1;
          cb();
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
  expect(count).toBe(3);
});
