/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { ICallback } from '../../src/async/index.js';
import { async } from '../../src/async/index.js';
import { CallbackEmptyReplyError } from '../../src/errors/index.js';

describe('withCallback', () => {
  it('should pass resource from setup to operation and return result when both succeed', () => {
    const setupResource = { data: 'setup-data' };
    const operationResult = { result: 'operation-result' };

    const setup = (cb: ICallback<typeof setupResource>) => {
      cb(null, setupResource);
    };

    const operation = (
      resource: typeof setupResource,
      cb: ICallback<typeof operationResult>,
    ) => {
      expect(resource).toBe(setupResource);
      cb(null, operationResult);
    };

    let callbackResult: typeof operationResult | undefined;
    let callbackError: Error | null | undefined;

    const callback: ICallback<typeof operationResult> = (err, result) => {
      callbackError = err;
      callbackResult = result;
    };

    async.withCallback(setup, operation, callback);

    expect(callbackError).toBeNull();
    expect(callbackResult).toBe(operationResult);
  });

  it('should propagate error from setup function to callback', () => {
    const setupError = new Error('Setup failed');

    const setup = (cb: ICallback<void>) => {
      cb(setupError);
    };

    const operation = (resource: void, cb: ICallback<string>) => {
      cb(null, 'This should not be called');
    };

    let callbackResult: unknown = undefined;
    let callbackError: Error | null | undefined;

    const callback: ICallback<unknown> = (err, result) => {
      callbackError = err;
      callbackResult = result;
    };

    async.withCallback(setup, operation, callback);

    expect(callbackError).toBe(setupError);
    expect(callbackResult).toBeUndefined();
  });

  it('should pass the resource from setup to operation function', () => {
    const setup = (cb: ICallback<string>) => cb(null, 'resource');
    const operation = (resource: string, cb: ICallback<string>) => {
      expect(resource).toBe('resource');
      cb(null, 'result');
    };
    const callback: ICallback<string> = (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe('result');
    };
    async.withCallback(setup, operation, callback);
  });

  it('should pass the final result from operation to the callback', () => {
    const setup = (cb: ICallback<string>) => cb(null, 'resource');
    const operation = (resource: string, cb: ICallback<string>) =>
      cb(null, 'finalResult');
    const callback: ICallback<string> = (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe('finalResult');
    };
    async.withCallback(setup, operation, callback);
  });

  it('should handle asynchronous operations correctly', async () => {
    const result = await new Promise((resolve, reject) => {
      const setup = (cb: ICallback<string>) =>
        setTimeout(() => cb(null, 'asyncResource'), 100);
      const operation = (resource: string, cb: ICallback<string>) =>
        setTimeout(() => cb(null, 'asyncResult'), 100);
      const callback: ICallback<string> = (err, result) => {
        if (err) reject(err);
        else resolve(result);
      };
      async.withCallback(setup, operation, callback);
    });
    expect(result).toBe('asyncResult');
  });

  it('should handle null resource from setup function', () => {
    const setup = (cb: ICallback<null>) => cb(null, null);
    const operation = (resource: null, cb: ICallback<string>) =>
      cb(null, `Result is ${resource}`);
    const callback: ICallback<string> = (err, result) => {
      expect(err).toBeInstanceOf(CallbackEmptyReplyError);
      expect(result).toBeUndefined();
    };
    async.withCallback(setup, operation, callback);
  });

  it('should handle undefined resource from setup function', () => {
    const setup = (cb: ICallback<undefined>) => cb(null, undefined);
    const operation = (resource: unknown, cb: ICallback<string>) =>
      cb(null, `Result is ${resource}`);
    const callback: ICallback<string> = (err, result) => {
      expect(err).toBeInstanceOf(CallbackEmptyReplyError);
      expect(result).toBeUndefined();
    };
    async.withCallback(setup, operation, callback);
  });

  it('should handle error from operation function', () => {
    const setup = (cb: ICallback<string>) => cb(null, 'resource');
    const operation = (resource: string, cb: ICallback<string>) =>
      cb(new Error('Operation error'));
    const callback: ICallback<string> = (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Operation error');
      expect(result).toBeUndefined();
    };
    async.withCallback(setup, operation, callback);
  });

  it('should maintain error context when propagating errors', () => {
    const setup = (cb: ICallback<string>) => cb(new Error('Setup error'));
    const operation = (resource: string, cb: ICallback<string>) =>
      cb(null, 'result');
    const callback: ICallback<string> = (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Setup error');
      expect(result).toBeUndefined();
    };
    async.withCallback(setup, operation, callback);
  });
});
