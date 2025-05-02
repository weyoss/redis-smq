/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Standard Node.js-style callback interface
 * @template TResult - The type of the successful result
 */
export interface ICallback<TResult = void> {
  /**
   * @param err - Error object if operation failed, null/undefined if successful
   * @param result - Result data if operation was successful
   */
  (err?: Error | null, result?: TResult): void;

  /**
   * Overload for successful case with explicit null/undefined error
   * @param err - Must be null or undefined to indicate success
   * @param result - Result data from the successful operation
   */
  (err: null | undefined, result: TResult): void;
}

/**
 * Represents an asynchronous operation that accepts a callback
 * @template TResult - The type of result the operation produces
 */
export type TAsyncOperation<TResult> = (cb: ICallback<TResult>) => void;

/**
 * An array of asynchronous operations that can be executed sequentially or in parallel
 * Each operation in the array can produce a different result type
 */
export type TAsyncOperationList = Array<TAsyncOperation<unknown>>;

/**
 * Helper type to extract the result type from a callback-based async operation
 * @template T - The async operation type
 */
export type ExtractAsyncOperationReturnType<
  T extends TAsyncOperation<unknown>,
> = T extends TAsyncOperation<infer R> ? R : never;

/**
 * Maps an array of operation types to an array of their result types
 * @template AsyncOperationList - Array of async operations
 */
export type MapAsyncOperationReturnTypeToResult<
  AsyncOperationList extends TAsyncOperationList,
> = {
  [K in keyof AsyncOperationList]: ExtractAsyncOperationReturnType<
    AsyncOperationList[K]
  >;
};
