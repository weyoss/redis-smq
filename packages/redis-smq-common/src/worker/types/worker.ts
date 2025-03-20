/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../common/index.js';

export enum EWorkerType {
  CALLABLE,
  RUNNABLE,
}

export type TWorkerCallableFunction = (
  args: unknown,
  cb: ICallback<unknown>,
) => void;

export type TWorkerRunnableFunctionFactory = (
  initialPayload: unknown,
) => IWorkerRunnable;

export type TWorkerFunction =
  | TWorkerRunnableFunctionFactory
  | TWorkerCallableFunction;

export interface IWorkerRunnable {
  run(cb: ICallback<void>): void;

  shutdown(cb: ICallback<void>): void;
}

export interface IWorkerCallable<Payload, Reply> {
  call(args: Payload, cb: ICallback<Reply>): void;
}
