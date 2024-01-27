/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EWorkerThreadMessageCodeExit {
  WORKER_DATA_REQUIRED = 100,
  INVALID_HANDLER_TYPE,
  HANDLER_IMPORT_ERROR,
  UNCAUGHT_EXCEPTION,
  TERMINATED,
}

export enum EWorkerThreadMessageCodeConsume {
  OK = 200,
  MESSAGE_PROCESSING_ERROR,
  MESSAGE_PROCESSING_CAUGHT_ERROR,
}

export type TWorkerThreadMessageCode =
  | EWorkerThreadMessageCodeExit
  | EWorkerThreadMessageCodeConsume;

export type TWorkerThreadError = {
  name: string;
  message: string;
};

export type TWorkerThreadMessage = {
  code: TWorkerThreadMessageCode;
  error: TWorkerThreadError | null;
};
