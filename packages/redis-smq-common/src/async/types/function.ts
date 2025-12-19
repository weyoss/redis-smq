/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from './callback.js';

/**
 * A generic function type that can accept any number of arguments and return any type
 * @template TArgs - The types of the arguments
 * @template TReturn - The return type of the function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunction<TArgs extends any[] = any[], TReturn = any> = (
  ...args: TArgs
) => TReturn;

/**
 * Represents a tuple where the last element is a callback function
 * @template TArgs - The types of the arguments in the tuple (excluding the callback)
 * @template TResult - The type of result passed to the callback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TAsyncFunction<TArgs extends any[] = [], TResult = any> = [
  ...args: TArgs,
  callback: ICallback<TResult>,
];
