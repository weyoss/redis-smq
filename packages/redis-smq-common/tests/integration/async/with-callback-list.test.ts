/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ICallback } from '../../../src/async/index.js';
import { async } from '../../../src/async/index.js';

function runWithCallbackList<O>(
  setups: Array<(cb: ICallback<unknown>) => void>,
  operation: (resources: unknown[], cb: ICallback<O>) => void,
): Promise<O> {
  return new Promise((resolve, reject) => {
    async.withCallbackList(setups, operation, (err, result) =>
      err ? reject(err) : resolve(result as O),
    );
  });
}

describe('withCallbackList', () => {
  it('runs each setup in order and passes all resources to the operation', async () => {
    const setup1 = vi.fn((cb: ICallback<unknown>) =>
      setTimeout(() => cb(null, 'r1'), 5),
    );
    const setup2 = vi.fn((cb: ICallback<unknown>) =>
      setTimeout(() => cb(null, 42), 10),
    );
    const op = vi.fn((resources: unknown[], cb: ICallback<string>) => {
      expect(resources).toEqual(['r1', 42]);
      cb(null, 'ok');
    });

    const result = await runWithCallbackList([setup1, setup2], op);
    expect(result).toBe('ok');
    expect(setup1).toHaveBeenCalled();
    expect(setup2).toHaveBeenCalled();
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('stops on the first setup error and does not invoke later setups or the operation', async () => {
    const setup1 = vi.fn((cb: ICallback<unknown>) =>
      setTimeout(() => cb(new Error('setup failed')), 5),
    );
    const setup2 = vi.fn((cb: ICallback<unknown>) =>
      setTimeout(() => cb(null, 42), 10),
    );
    const op = vi.fn();

    await expect(runWithCallbackList([setup1, setup2], op)).rejects.toThrow(
      'setup failed',
    );

    expect(setup1).toHaveBeenCalled();
    expect(setup2).not.toHaveBeenCalled();
    expect(op).not.toHaveBeenCalled();
  });

  it('executes the operation immediately when the setups array is empty', async () => {
    const op = vi.fn((resources: unknown[], cb: ICallback<string>) => {
      expect(resources).toEqual([]);
      cb(null, 'ok');
    });
    await expect(runWithCallbackList([], op)).resolves.toBe('ok');
    expect(op).toHaveBeenCalledWith([], expect.any(Function));
  });

  it('rejects when a setup returns undefined, naming the failing index', async () => {
    await expect(
      runWithCallbackList(
        [(cb) => cb(null, undefined), (cb) => cb(null, 'r2')],
        vi.fn(),
      ),
    ).rejects.toThrow('Setup operation at index 0 returned empty result');
  });

  it('preserves the order of setup results regardless of completion timing', async () => {
    // Setup 2 resolves faster than setup 1; the resulting array is still
    // keyed by setup index.
    const setup1 = (cb: ICallback<unknown>) =>
      setTimeout(() => cb(null, 'first'), 10);
    const setup2 = (cb: ICallback<unknown>) =>
      setTimeout(() => cb(null, 'second'), 2);
    const op = vi.fn((_resources: unknown[], cb: ICallback<string>) =>
      cb(null, 'ok'),
    );
    await runWithCallbackList([setup1, setup2], op);
    expect(op).toHaveBeenCalledWith(['first', 'second'], expect.any(Function));
  });
});
