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
import { CallbackEmptyReplyError } from '../../../src/errors/index.js';

function runWithCallback<R, O>(
  setup: (cb: ICallback<R>) => void,
  operation: (resource: R, cb: ICallback<O>) => void,
): Promise<O> {
  return new Promise((resolve, reject) => {
    async.withCallback(setup, operation, (err, result) =>
      err ? reject(err) : resolve(result as O),
    );
  });
}

describe('withCallback', () => {
  it('passes the setup resource to the operation and forwards the result', async () => {
    const result = await runWithCallback(
      (cb) => cb(null, { data: 'setup' }),
      (resource, cb) => cb(null, { result: 'op', saw: resource }),
    );
    expect(result).toEqual({ result: 'op', saw: { data: 'setup' } });
  });

  it('propagates setup errors without calling the operation', async () => {
    const op = vi.fn();
    await expect(
      runWithCallback((cb) => cb(new Error('setup failed')), op),
    ).rejects.toThrow('setup failed');
    expect(op).not.toHaveBeenCalled();
  });

  it('rejects with CallbackEmptyReplyError when setup returns null', async () => {
    await expect(
      runWithCallback(
        (cb) => cb(null, null as unknown),
        (_r, cb) => cb(null, 'ok'),
      ),
    ).rejects.toBeInstanceOf(CallbackEmptyReplyError);
  });

  it('rejects with CallbackEmptyReplyError when setup returns undefined', async () => {
    await expect(
      runWithCallback(
        (cb) => cb(null, undefined as unknown),
        (_r, cb) => cb(null, 'ok'),
      ),
    ).rejects.toBeInstanceOf(CallbackEmptyReplyError);
  });

  it('propagates operation errors', async () => {
    await expect(
      runWithCallback(
        (cb) => cb(null, 'resource'),
        (_r, cb) => cb(new Error('operation failed')),
      ),
    ).rejects.toThrow('operation failed');
  });

  it('handles async setup and operation', async () => {
    const result = await runWithCallback(
      (cb) => setTimeout(() => cb(null, 'resource'), 10),
      (r, cb) => setTimeout(() => cb(null, `${r}-result`), 10),
    );
    expect(result).toBe('resource-result');
  });

  it('preserves the original error when setup fails', async () => {
    const setupError = new Error('setup failed');
    await expect(
      runWithCallback(
        (cb) => cb(setupError),
        (_r, cb) => cb(null, 'result'),
      ),
    ).rejects.toBe(setupError);
  });
});
