/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { describe, expect, it, vi } from 'vitest';
import { ICallback } from '../../src/async/index.js';
import { async } from '../../src/async/index.js';

const withCallbackListAsync = bluebird.promisify(async.withCallbackList);

describe('withCallbackList', () => {
  it('should execute operation with all setup results when all setups complete successfully', async () => {
    // Arrange
    const setup1 = vi.fn((cb: ICallback<string>) => {
      setTimeout(() => cb(null, 'resource1'), 10);
    });

    const setup2 = vi.fn((cb: ICallback<number>) => {
      setTimeout(() => cb(null, 42), 5);
    });

    const operation = vi.fn(
      (resources: [string, number], cb: ICallback<boolean>) => {
        expect(resources[0]).toBe('resource1');
        expect(resources[1]).toBe(42);
        cb(null, true);
      },
    );

    // Act
    const r = await withCallbackListAsync([setup1, setup2], operation);
    expect(r).toBe(true);

    // Assert
    expect(setup1).toHaveBeenCalled();
    expect(setup2).toHaveBeenCalled();
    expect(operation).toHaveBeenCalled();
  }, 10000);

  it('should call callback with error when any setup function fails', async () => {
    // Arrange
    const expectedError = new Error('Setup failed');

    const setup1 = vi.fn((cb: ICallback<string>) => {
      setTimeout(() => cb(expectedError), 10);
    });

    const setup2 = vi.fn((cb: ICallback<number>) => {
      setTimeout(() => cb(null, 42), 20);
    });

    const operation = vi.fn();

    await expect(() =>
      withCallbackListAsync([setup1, setup2], operation),
    ).rejects.toThrowError('Setup failed');

    expect(setup1).toHaveBeenCalled();
    expect(setup2).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  }, 5000);

  it('should pass all setup resources to the operation function', async () => {
    const setup1 = vi.fn((cb: ICallback<string>) => cb(null, 'resource1'));
    const setup2 = vi.fn((cb: ICallback<string>) => cb(null, 'resource2'));
    const operation = vi.fn((resources: unknown, cb: ICallback<string>) =>
      cb(null, 'operationResult'),
    );

    const r = await withCallbackListAsync([setup1, setup2], operation);
    expect(r).toBe('operationResult');

    expect(operation).toHaveBeenCalledWith(
      ['resource1', 'resource2'],
      expect.any(Function),
    );
  }, 5000);

  it('should execute operation immediately when setups array is empty', async () => {
    const operation = vi.fn((resources: unknown, cb: ICallback<string>) =>
      cb(null, 'operationResult'),
    );

    const r = await withCallbackListAsync([], operation);
    expect(r).toBe('operationResult');

    expect(operation).toHaveBeenCalledWith([], expect.any(Function));
  }, 5000);

  it('should maintain the correct order of resources in the results array', async () => {
    const setup1 = vi.fn((cb: ICallback<string>) =>
      setTimeout(() => cb(null, 'first'), 5000),
    );
    const setup2 = vi.fn((cb: ICallback<string>) =>
      setTimeout(() => cb(null, 'second'), 1000),
    );
    const operation = vi.fn((resources: unknown, cb: ICallback<string>) =>
      cb(null, 'operationResult'),
    );

    const r = await withCallbackListAsync([setup1, setup2], operation);
    expect(r).toBe('operationResult');

    expect(operation).toHaveBeenCalledWith(
      ['first', 'second'],
      expect.any(Function),
    );
  }, 15000);

  it('should handle undefined resources from setup functions', async () => {
    const setup1 = vi.fn((cb: ICallback<string>) => cb(null, undefined));
    const setup2 = vi.fn((cb: ICallback<string>) => cb(null, 'resource2'));
    const operation = vi.fn();

    await expect(() =>
      withCallbackListAsync([setup1, setup2], operation),
    ).rejects.toThrowError('Setup operation at index 0 returned empty result');

    expect(setup1).toHaveBeenCalled();
    expect(setup2).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  }, 5000);

  it('should stop processing after first error is encountered', async () => {
    const setup1 = vi.fn((cb: ICallback) =>
      setTimeout(() => cb(new Error('Setup error')), 1000),
    );
    const setup2 = vi.fn((cb: ICallback) => setTimeout(() => cb(), 1000));
    const operation = vi.fn();

    await expect(() =>
      withCallbackListAsync([setup1, setup2], operation),
    ).rejects.toThrowError('Setup error');

    expect(setup1).toHaveBeenCalled();
    expect(setup2).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  }, 5000);

  it('should execute all setup functions concurrently and call operation with results', async () => {
    const setup1 = vi.fn((cb: ICallback<string>) =>
      setTimeout(() => cb(null, 'resource1'), 100),
    );
    const setup2 = vi.fn((cb: ICallback<string>) =>
      setTimeout(() => cb(null, 'resource2'), 50),
    );
    const operation = vi.fn((resources: unknown, cb: ICallback<string>) =>
      cb(null, 'operationResult'),
    );
    const result = await withCallbackListAsync([setup1, setup2], operation);
    expect(result).toBe('operationResult');
    expect(setup1).toHaveBeenCalled();
    expect(setup2).toHaveBeenCalled();
    expect(operation).toHaveBeenCalledWith(
      ['resource1', 'resource2'],
      expect.any(Function),
    );
  }, 5000);
});
