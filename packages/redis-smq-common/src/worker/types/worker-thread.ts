/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EWorkerType } from './worker.js';

export interface IWorkerThreadData {
  type: EWorkerType;
  filename: string;
  initialPayload: unknown;
}

export enum EWorkerThreadChildExitCode {
  WORKER_DATA_REQUIRED = 100,
  INVALID_WORKER_TYPE,
  FILE_IMPORT_ERROR,
  UNCAUGHT_EXCEPTION,
  FILE_EXTENSION_ERROR,
  FILE_READ_ERROR,
  TERMINATED,
}

export enum EWorkerThreadChildExecutionCode {
  OK = 200,
  PROCESSING_ERROR,
  PROCESSING_CAUGHT_ERROR,
}

export type TWorkerThreadChildMessageCode =
  | EWorkerThreadChildExitCode
  | EWorkerThreadChildExecutionCode;

export type TWorkerThreadChildError = {
  name: string;
  message: string;
};

export type TWorkerThreadChildMessage<Data = unknown> = {
  code: TWorkerThreadChildMessageCode;
  data?: Data;
  error?: TWorkerThreadChildError | null;
};

export enum EWorkerThreadParentMessage {
  CALL,
  RUN,
  SHUTDOWN,
}

export type TWorkerThreadParentMessageCall = {
  type: EWorkerThreadParentMessage.CALL;
  payload: unknown;
};

export type TWorkerThreadParentMessageRun = {
  type: EWorkerThreadParentMessage.RUN;
};

export type TWorkerThreadParentMessageShutdown = {
  type: EWorkerThreadParentMessage.SHUTDOWN;
};

export type TWorkerThreadParentMessage =
  | TWorkerThreadParentMessageCall
  | TWorkerThreadParentMessageRun
  | TWorkerThreadParentMessageShutdown;
