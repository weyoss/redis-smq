/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { withOptionalCallback } from '../../src/async/with-optional-callback.js';
import { ICallback } from '../../src/async/index.js';

describe('withOptionalCallback', () => {
  describe('when callback is provided', () => {
    it('should call the callback with success result', () => {
      const mockFn = vi.fn((cb: ICallback<string>) => {
        cb(null, 'success');
      });
      const mockCb = vi.fn();

      const result = withOptionalCallback(mockCb, mockFn);

      expect(result).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockCb).toHaveBeenCalledTimes(1);
      expect(mockCb).toHaveBeenCalledWith(null, 'success');
    });

    it('should call the callback with error', () => {
      const error = new Error('test error');
      const mockFn = vi.fn((cb: ICallback<string>) => {
        cb(error);
      });
      const mockCb = vi.fn();

      const result = withOptionalCallback(mockCb, mockFn);

      expect(result).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockCb).toHaveBeenCalledTimes(1);
      expect(mockCb).toHaveBeenCalledWith(error);
    });

    it('should pass the callback to the async function', () => {
      const mockFn = vi.fn();
      const mockCb = vi.fn();

      withOptionalCallback(mockCb, mockFn);

      expect(mockFn).toHaveBeenCalledWith(mockCb);
    });
  });

  describe('when callback is not provided', () => {
    it('should return a promise that resolves on success', async () => {
      const expectedResult = 'success data';
      const mockFn = vi.fn((cb: ICallback<string>) => {
        cb(null, expectedResult);
      });

      const promise = withOptionalCallback(undefined, mockFn);

      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;
      expect(result).toBe(expectedResult);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return a promise that rejects on error', async () => {
      const error = new Error('async error');
      const mockFn = vi.fn((cb: ICallback<string>) => {
        cb(error);
      });

      const promise = withOptionalCallback(undefined, mockFn);

      await expect(promise).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle different result types', async () => {
      const numberResult = 42;
      const mockFnNumber = vi.fn((cb: ICallback<number>) => {
        cb(null, numberResult);
      });

      const promiseNumber = withOptionalCallback(undefined, mockFnNumber);
      await expect(promiseNumber).resolves.toBe(42);

      const objectResult = { id: 1, name: 'test' };
      const mockFnObject = vi.fn((cb: ICallback<typeof objectResult>) => {
        cb(null, objectResult);
      });

      const promiseObject = withOptionalCallback(undefined, mockFnObject);
      await expect(promiseObject).resolves.toEqual(objectResult);

      const arrayResult = [1, 2, 3];
      const mockFnArray = vi.fn((cb: ICallback<number[]>) => {
        cb(null, arrayResult);
      });

      const promiseArray = withOptionalCallback(undefined, mockFnArray);
      await expect(promiseArray).resolves.toEqual([1, 2, 3]);
    });
  });

  describe('edge cases', () => {
    it('should handle null result values', async () => {
      const mockFn = vi.fn((cb: ICallback<null>) => {
        cb(null, null);
      });

      const result = await withOptionalCallback(undefined, mockFn);
      expect(result).toBeNull();
    });

    it('should handle undefined result values', async () => {
      const mockFn = vi.fn((cb: ICallback<void>) => {
        cb(null);
      });

      const result = await withOptionalCallback(undefined, mockFn);
      expect(result).toBeUndefined();
    });

    it('should handle synchronous errors in the async function', () => {
      const error = new Error('sync error');
      const mockFn = vi.fn(() => {
        throw error;
      });
      const mockCb = vi.fn();

      expect(() => {
        withOptionalCallback(mockCb, mockFn);
      }).toThrow(error);
    });

    it('should handle async function that calls callback multiple times', async () => {
      const mockFn = vi.fn((cb: ICallback<number>) => {
        cb(null, 1);
        cb(null, 2); // Second call should be ignored in promise mode
      });

      const result = await withOptionalCallback(undefined, mockFn);
      expect(result).toBe(1);
    });

    it('should handle undefined callback with proper typing', () => {
      const mockFn = vi.fn((cb: ICallback<string>) => {
        cb(null, 'test');
      });

      // TypeScript should allow undefined
      const promise = withOptionalCallback(undefined, mockFn);
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('integration with real async operations', () => {
    it('should work with setTimeout', async () => {
      const asyncOperation = (cb: ICallback<string>) => {
        setTimeout(() => {
          cb(null, 'delayed result');
        }, 10);
      };

      const result = await withOptionalCallback(undefined, asyncOperation);
      expect(result).toBe('delayed result');
    });

    it('should work with setTimeout error', async () => {
      const asyncOperation = (cb: ICallback<string>) => {
        setTimeout(() => {
          cb(new Error('timeout error'));
        }, 10);
      };

      await expect(
        withOptionalCallback(undefined, asyncOperation),
      ).rejects.toThrow('timeout error');
    });

    it('should maintain callback order with multiple calls', () => {
      const order: number[] = [];
      const mockFn = vi.fn((cb: ICallback<number>) => {
        order.push(1);
        cb(null, 42);
        order.push(2);
      });
      const mockCb = vi.fn(() => {
        order.push(3);
      });

      withOptionalCallback(mockCb, mockFn);

      expect(order).toEqual([1, 3, 2]);
    });
  });
});
