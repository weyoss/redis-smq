/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { assert, describe, expect, it } from 'vitest';
import { async, ICallback } from '../../src/async/index.js';

type T = Parameters<typeof async.withRetry>;
const withRetryAsync = (operation: T[0], options: T[1]) => {
  return new Promise((resolve, reject) => {
    async.withRetry(operation, options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

describe('withRetry', () => {
  it('should call callback with result when operation succeeds on first attempt', async () => {
    const expectedResult = 'success';

    const operation = (cb: ICallback<string>) => {
      cb(null, expectedResult);
    };

    const result = await withRetryAsync(operation, { maxAttempts: 3 });
    assert.strictEqual(result, expectedResult);
  }, 0);

  it('should call callback with error when all retry attempts fail', async () => {
    const expectedError = new Error('Operation failed');
    const maxAttempts = 3;
    let attemptCount = 0;

    const operation = (cb: ICallback<string>) => {
      attemptCount++;
      cb(expectedError);
    };

    await expect(() =>
      withRetryAsync(operation, { maxAttempts }),
    ).rejects.toThrow(expectedError);

    expect(attemptCount).toBe(maxAttempts);
  });

  it('should succeed on retry when operation fails initially', async () => {
    let attempt = 0;
    const operation = (cb: ICallback<string>) => {
      attempt++;
      if (attempt === 1) {
        cb(new Error('Initial failure'));
      } else {
        cb(null, 'Success');
      }
    };
    const result = await withRetryAsync(operation, { maxAttempts: 3 });
    expect(result).toBe('Success');
  }, 5000);

  it('should retry only specific errors based on custom shouldRetry function', async () => {
    let attempt = 0;
    const operation = (cb: ICallback<string>) => {
      attempt++;
      if (attempt < 3) {
        cb(new Error('Retryable error'));
      } else {
        cb(null, 'Success');
      }
    };

    const result = await withRetryAsync(operation, {
      maxAttempts: 3,
      shouldRetry: (err) => err.message === 'Retryable error',
    });
    expect(result).toBe('Success');
  }, 5000);

  it('should use default options when not provided', async () => {
    let attempt = 0;
    const operation = (cb: ICallback<string>) => {
      attempt++;
      if (attempt < 3) {
        cb(new Error('Temporary error'));
      } else {
        cb(null, 'Success');
      }
    };
    const result = await withRetryAsync(operation, {});
    expect(result).toBe('Success');
  }, 5000);

  it('should handle synchronous exceptions thrown by the operation', async () => {
    const operation = () => {
      throw new Error('Synchronous error');
    };

    await expect(() => withRetryAsync(operation, {})).rejects.toThrow(
      'Synchronous error',
    );
  }, 5000);

  it('should stop retrying when operation exceeds maxAttempts', async () => {
    const operation = (cb: ICallback) => {
      cb(new Error('Operation failed'));
    };

    const options = { maxAttempts: 2, retryDelay: 10 };
    await expect(() => withRetryAsync(operation, options)).rejects.toThrow(
      'Operation failed',
    );
  }, 5000);

  it('should not retry when shouldRetry returns false', async () => {
    let attemptCount = 0;
    const operation = (cb: ICallback) => {
      attemptCount++;
      cb(new Error('Operation failed'));
    };
    const options = {
      maxAttempts: 3,
      retryDelay: 10,
      shouldRetry: () => false,
    };

    await expect(() => withRetryAsync(operation, options)).rejects.toThrow(
      'Operation failed',
    );

    expect(attemptCount).toBe(1);
  }, 5000);

  it('should not retry when maxAttempts is zero', async () => {
    let attemptCount = 0;
    const operation = (cb: ICallback) => {
      attemptCount++;
      cb(new Error('Operation failed'));
    };
    const options = { maxAttempts: 0, retryDelay: 10 };

    await expect(() => withRetryAsync(operation, options)).rejects.toThrow(
      'Operation failed',
    );
    expect(attemptCount).toBe(1);
  }, 5000);

  it('should handle negative retryDelay by not delaying retries', async () => {
    const operation = (cb: ICallback) => {
      cb(new Error('Fail'));
    };
    const options = { maxAttempts: 2, retryDelay: -1000 };
    await expect(() => withRetryAsync(operation, options)).rejects.toThrow(
      'Fail',
    );
  }, 5000);

  it('should handle operation that succeeds with undefined result', async () => {
    const operation = (cb: ICallback<unknown>) => {
      cb(null, undefined);
    };
    const options = { maxAttempts: 0 };
    const result = await withRetryAsync(operation, options);
    expect(result).toBeUndefined();
  }, 5000);

  it('should use only the first callback invocation', async () => {
    let callCount = 0;
    const operation = (cb: ICallback<string>) => {
      callCount++;
      if (callCount === 1) {
        cb(null, 'Success');
      } else {
        cb(new Error('Fail'));
      }
    };
    const options = { maxAttempts: 3 };
    const result = await withRetryAsync(operation, options);
    expect(result).toBe('Success');
  });

  it('should respect the retry delay timing between attempts', async () => {
    const operation = (cb: ICallback) => cb(new Error('fail'));
    const options = { maxAttempts: 3, retryDelay: 1000 };

    const startTime = Date.now();
    let caughtError = false;
    try {
      await withRetryAsync(operation, options);
    } catch {
      caughtError = true;
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      expect(elapsedTime).toBeGreaterThanOrEqual(2000);
    }
    expect(caughtError).toBe(true);
  });

  it('should transform thrown errors into callback errors', async () => {
    const operation = () => {
      throw new Error('operation error');
    };
    await expect(() => withRetryAsync(operation, {})).rejects.toThrow(
      'operation error',
    );
  });
});
