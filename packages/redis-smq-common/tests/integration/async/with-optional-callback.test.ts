/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import { withOptionalCallback } from '../../../src/async/with-optional-callback.js';
import type { ICallback } from '../../../src/async/index.js';

describe('withOptionalCallback', () => {
  describe('with callback', () => {
    it('invokes the callback with a success result', () => {
      const fn = vi.fn((cb: ICallback<string>) => cb(null, 'success'));
      const cb = vi.fn();

      const result = withOptionalCallback(cb, fn);

      expect(result).toBeUndefined();
      expect(cb).toHaveBeenCalledWith(null, 'success');
    });

    it('invokes the callback with an error', () => {
      const error = new Error('test error');
      const fn = vi.fn((cb: ICallback<string>) => cb(error));
      const cb = vi.fn();

      withOptionalCallback(cb, fn);

      expect(cb).toHaveBeenCalledWith(error);
    });

    it('passes the callback straight through to the function', () => {
      const fn = vi.fn();
      const cb = vi.fn();

      withOptionalCallback(cb, fn);

      expect(fn).toHaveBeenCalledWith(cb);
    });

    it('invokes the callback synchronously within the function body', () => {
      const order: number[] = [];
      const fn = vi.fn((cb: ICallback<number>) => {
        order.push(1);
        cb(null, 42);
        order.push(2);
      });
      const cb = vi.fn(() => order.push(3));

      withOptionalCallback(cb, fn);

      expect(order).toEqual([1, 3, 2]);
    });
  });

  describe('without callback', () => {
    it('returns a promise resolving to the result', async () => {
      const fn = (cb: ICallback<string>) => cb(null, 'value');
      await expect(withOptionalCallback(undefined, fn)).resolves.toBe('value');
    });

    it('returns a promise rejecting on error', async () => {
      const fn = (cb: ICallback<string>) => cb(new Error('async error'));
      await expect(withOptionalCallback(undefined, fn)).rejects.toThrow(
        'async error',
      );
    });

    it('handles various result types', async () => {
      await expect(
        withOptionalCallback(undefined, (cb: ICallback<number>) =>
          cb(null, 42),
        ),
      ).resolves.toBe(42);
      await expect(
        withOptionalCallback(undefined, (cb: ICallback<object>) =>
          cb(null, { id: 1, name: 'test' }),
        ),
      ).resolves.toEqual({ id: 1, name: 'test' });
      await expect(
        withOptionalCallback(undefined, (cb: ICallback<number[]>) =>
          cb(null, [1, 2, 3]),
        ),
      ).resolves.toEqual([1, 2, 3]);
    });

    it('handles null result values', async () => {
      const fn = (cb: ICallback<null>) => cb(null, null);
      await expect(withOptionalCallback(undefined, fn)).resolves.toBeNull();
    });

    it('handles undefined result values', async () => {
      const fn = (cb: ICallback<void>) => cb(null);
      await expect(
        withOptionalCallback(undefined, fn),
      ).resolves.toBeUndefined();
    });

    it('propagates synchronous errors thrown by the function', () => {
      const error = new Error('sync error');
      const fn = () => {
        throw error;
      };
      expect(() => withOptionalCallback(vi.fn(), fn)).toThrow(error);
    });

    it('uses only the first callback invocation in promise mode', async () => {
      const fn = (cb: ICallback<number>) => {
        cb(null, 1);
        cb(null, 2); // second call should be ignored
      };
      await expect(withOptionalCallback(undefined, fn)).resolves.toBe(1);
    });
  });

  describe('real async operations', () => {
    it('resolves with a delayed result', async () => {
      const fn = (cb: ICallback<string>) =>
        setTimeout(() => cb(null, 'delayed result'), 10);
      await expect(withOptionalCallback(undefined, fn)).resolves.toBe(
        'delayed result',
      );
    });

    it('rejects with a delayed error', async () => {
      const fn = (cb: ICallback<string>) =>
        setTimeout(() => cb(new Error('timeout error')), 10);
      await expect(withOptionalCallback(undefined, fn)).rejects.toThrow(
        'timeout error',
      );
    });
  });
});
