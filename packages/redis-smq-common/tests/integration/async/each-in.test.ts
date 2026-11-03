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

function runEachIn<V>(
  map: Record<string, V>,
  iteratee: (item: V, key: string, cb: ICallback<void>) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    async.eachIn(map, iteratee, (err) => (err ? reject(err) : resolve()));
  });
}

describe('async.eachIn', () => {
  it('iterates all object entries exactly once', async () => {
    // Annotated as Record<string, number> so `map[key]` (with key: string)
    // is legal inside the iteratee. Without this, TS narrows the literal to
    // `{ first: …; second: …; third: … }` and rejects the string index.
    const map: Record<string, number> = { first: 1, second: 2, third: 3 };
    const remaining = new Set(Object.keys(map));

    await runEachIn(map, (item, key, cb) => {
      expect(remaining.has(key)).toBe(true);
      expect(map[key]).toBe(item);
      remaining.delete(key);
      cb();
    });

    expect(remaining.size).toBe(0);
  });

  it('stops on the first error and rejects', async () => {
    const map: Record<string, number> = { first: 1, second: 2, third: 3 };
    await expect(
      runEachIn(map, (_item, _key, cb) => cb(new Error('explicit error'))),
    ).rejects.toThrow('explicit error');
  });

  it('resolves immediately when the map is empty', async () => {
    const map: Record<string, number> = {};
    await expect(
      runEachIn(map, () => {
        throw new Error('unexpected');
      }),
    ).resolves.toBeUndefined();
  });
});
