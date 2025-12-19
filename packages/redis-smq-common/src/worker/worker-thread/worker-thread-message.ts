/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { MessagePort, parentPort } from 'worker_threads';
import {
  EWorkerThreadChildExecutionCode,
  TWorkerThreadChildMessage,
  TWorkerThreadChildMessageCode,
} from '../types/index.js';

function formatErrorMessage(
  code: TWorkerThreadChildMessageCode,
  err?: unknown,
): TWorkerThreadChildMessage {
  const error =
    err && err instanceof Error
      ? { name: err.name, message: err.message }
      : null;
  return {
    code,
    error,
  };
}

function formatOKMessage(data?: unknown): TWorkerThreadChildMessage {
  return {
    code: EWorkerThreadChildExecutionCode.OK,
    data,
  };
}

export function postMessage(
  messagePort: MessagePort,
  code: TWorkerThreadChildMessageCode,
  err?: unknown,
  data?: unknown,
) {
  const msg =
    code === EWorkerThreadChildExecutionCode.OK
      ? formatOKMessage(data)
      : formatErrorMessage(code, err);
  messagePort.postMessage(msg);
}

export function exit(code: TWorkerThreadChildMessageCode, err?: unknown) {
  if (parentPort) postMessage(parentPort, code, err);
  process.exit(code);
}
