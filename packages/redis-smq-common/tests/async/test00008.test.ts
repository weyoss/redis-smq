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

it('async.eachIn: case 1', async () => {
  await new Promise<void>((resolve, reject) => {
    const map: Record<string, number> = { first: 1, second: 2, third: 3 };
    let keys = Object.keys(map);
    async.eachIn(
      map,
      (item, key, callback) => {
        expect(keys.includes(key)).toBe(true);
        expect(map[key]).toBe(item);
        keys = keys.filter((i) => i !== key);
        callback();
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
});
