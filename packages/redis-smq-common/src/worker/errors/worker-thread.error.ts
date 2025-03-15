/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadChildExitCode,
  TWorkerThreadChildMessage,
} from '../types/index.js';
import { WorkerError } from './worker-error.js';

export class WorkerThreadError extends WorkerError {
  constructor(msg: TWorkerThreadChildMessage) {
    const { code, error } = msg;
    const messageStr = `Error code: ${
      EWorkerThreadChildExitCode[code] ?? EWorkerThreadChildExecutionCode[code]
    }.${error ? ` Cause: ${error.name}(${error.message})` : ''}`;
    super(messageStr);
  }
}
