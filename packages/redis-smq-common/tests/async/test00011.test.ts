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

it('async.each: case 1', async () => {
  const promise = new Promise<string>((resolve, reject) => {
    const map: Record<string, number> = { first: 1, second: 2, third: 3 };
    async.each(
      map,
      (item, key, callback) => callback(),
      (err) => {
        if (err) reject(err);
        else resolve('OK');
      },
    );
  });
  await expect(promise).resolves.toBe('OK');
});
