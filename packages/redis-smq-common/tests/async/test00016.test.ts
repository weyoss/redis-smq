/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  async,
  AsyncCallbackTimeoutError,
  ICallback,
} from '../../src/async/index.js';

describe('withTimeout', () => {
  it('should invoke the callback with successful result when called before timeout', async () => {
    const timeoutMs = 1000;
    const operation: ICallback<string> = (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe('success');
    };
    const operationWithTimeout = async.withTimeout(operation, timeoutMs);

    // Call the operationWithTimeout immediately with success
    operationWithTimeout(null, 'success');

    // Wait to ensure timeout would have triggered if not cleared
    await new Promise((resolve) => setTimeout(resolve, timeoutMs * 2));
  });

  it('should trigger AsyncCallbackTimeoutError when timeout occurs', async () => {
    const timeoutMs = 1000;
    return new Promise<void>((resolve) => {
      const operation: ICallback<string> = (err, result) => {
        expect(err).toBeInstanceOf(AsyncCallbackTimeoutError);
        expect(result).toBeUndefined();
        resolve();
      };
      async.withTimeout<string>(operation, timeoutMs);
    });
  });

  it('should invoke callback with error before timeout', async () => {
    const timeoutMs = 4000;
    const expectedError = new Error('test error');
    const operation: ICallback<void> = (err, result) => {
      expect(err).toBe(expectedError);
      expect(result).toBeUndefined();
    };
    const operationWithTimeout = async.withTimeout(operation, timeoutMs);

    setTimeout(() => operationWithTimeout(expectedError), timeoutMs / 2);

    // Wait to ensure timeout would have triggered if not cleared
    await new Promise((resolve) => setTimeout(resolve, timeoutMs * 2));
  });

  it('should handle multiple wrapped callbacks simultaneously without interference', async () => {
    return new Promise<void>((resolve) => {
      let completed = 0;
      const checkDone = () => {
        completed += 1;
        if (completed === 2) resolve();
      };

      const operation1: ICallback<string> = (err, result) => {
        if (!err) {
          expect(result).toBe('Result 1');
          checkDone();
        }
      };
      const operation2: ICallback<string> = (err, result) => {
        if (!err) {
          expect(result).toBe('Result 2');
          checkDone();
        }
      };

      const operation1WithTimeout = async.withTimeout(operation1, 2000);
      const operation2WithTimeout = async.withTimeout(operation2, 2000);

      setTimeout(() => {
        operation1WithTimeout(null, 'Result 1');
      }, 500);

      setTimeout(() => {
        operation2WithTimeout(null, 'Result 2');
      }, 500);
    });
  });

  it('should process only the first call when called multiple times', async () => {
    let callCount = 0;
    const timeoutMs = 2000;
    const operation: ICallback<string> = (err) => {
      if (err) {
        throw err;
      }
      callCount++;
      expect(callCount).toBe(1);
    };
    const operationWithTimeout = async.withTimeout(operation, 1000);
    operationWithTimeout(null, 'first');
    operationWithTimeout(null, 'second');
    await new Promise((resolve) => setTimeout(resolve, timeoutMs * 2));
  });
});
