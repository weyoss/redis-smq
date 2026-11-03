/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { async, AsyncCallbackTimeoutError } from '../../../src/async/index.js';

// Small timeout — large enough to prove the timeout mechanism works,
// small enough that the whole file runs in ~150ms.
const TIMEOUT_MS = 30;
const TIMEOUT_WAIT_MS = TIMEOUT_MS * 2;

describe('withTimeout', () => {
  it('forwards a successful result when called before the timeout', async () => {
    const calls: Array<{ err: unknown; result: string | undefined }> = [];
    const wrapped = async.withTimeout<string>((err, result) => {
      calls.push({ err, result });
    }, TIMEOUT_MS);

    wrapped(null, 'success');
    await new Promise((r) => setTimeout(r, TIMEOUT_WAIT_MS));

    expect(calls).toEqual([{ err: null, result: 'success' }]);
  });

  it('forwards an error when called before the timeout', async () => {
    const expectedError = new Error('test error');
    const calls: Array<{ err: unknown }> = [];
    const wrapped = async.withTimeout((err) => {
      calls.push({ err });
    }, TIMEOUT_MS);

    wrapped(expectedError);
    await new Promise((r) => setTimeout(r, TIMEOUT_WAIT_MS));

    expect(calls).toHaveLength(1);
    expect(calls[0].err).toBe(expectedError);
  });

  it('emits AsyncCallbackTimeoutError when the callback is not called', async () => {
    const error = await new Promise<unknown>((resolve) => {
      async.withTimeout<string>((err) => resolve(err), TIMEOUT_MS);
    });
    expect(error).toBeInstanceOf(AsyncCallbackTimeoutError);
  });

  it('handles multiple wrapped callbacks independently', async () => {
    const results: string[] = [];
    const wrap = (name: string) =>
      async.withTimeout<string>((err, r) => {
        if (!err && r !== undefined) results.push(`${name}:${r}`);
      }, TIMEOUT_MS);

    const w1 = wrap('op1');
    const w2 = wrap('op2');
    w1(null, 'r1');
    w2(null, 'r2');

    await new Promise((r) => setTimeout(r, TIMEOUT_WAIT_MS));
    expect(results.sort()).toEqual(['op1:r1', 'op2:r2']);
  });

  it('ignores calls after the first', async () => {
    const results: Array<string | undefined> = [];
    const wrapped = async.withTimeout<string>(
      (_err, r) => results.push(r),
      TIMEOUT_MS,
    );

    wrapped(null, 'first');
    wrapped(null, 'second');

    await new Promise((r) => setTimeout(r, TIMEOUT_WAIT_MS));
    expect(results).toEqual(['first']);
  });
});
