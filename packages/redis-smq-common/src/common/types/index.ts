/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface ICallback<T> {
  (err?: Error | null, reply?: T): void;

  (err: undefined | null, reply: T): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TFunction<TReturn = void, TArgs = any> = (
  ...args: TArgs[]
) => TReturn;

export type TUnaryFunction<T, E = void> = (reply: T) => E;
