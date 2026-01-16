/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../async/index.js';

export enum EWorkerType {
  CALLABLE,
  RUNNABLE,
}

export type TCallableWorkerFunction = (
  args: unknown,
  cb: ICallback<unknown>,
) => void;

export type TRunnableWorkerFactory = (
  initialPayload: unknown,
) => IRunnableWorker;

export type TRunnableWorkerClass = new (
  initialPayload: unknown,
) => IRunnableWorker;

export type TWorkerDefinition =
  | TRunnableWorkerFactory
  | TRunnableWorkerClass
  | TCallableWorkerFunction;

export interface IRunnableWorker {
  run(cb: ICallback<void>): void;
  shutdown(cb: ICallback<void>): void;
}

export interface ICallableWorker<Input, Output> {
  call(input: Input, cb: ICallback<Output>): void;
}
