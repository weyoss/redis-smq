/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { statSync } from 'fs';
import { extname } from 'path';
import {
  isMainThread,
  MessagePort,
  parentPort,
  // type-coverage:ignore-next-line
  workerData,
} from 'worker_threads';
import {
  EWorkerThreadChildExitCode,
  EWorkerType,
  IWorkerThreadData,
  TWorkerFunction,
  TWorkerRunnableFunctionFactory,
} from '../types/index.js';
import { handleWorkerCallable } from './worker-thread-callable.js';
import { exit } from './worker-thread-message.js';
import { handleWorkerRunnable } from './worker-thread-runnable.js';

function importWorkerInstance(
  filename: string,
  cb: (worker: TWorkerFunction) => void,
): void {
  if (!['.js', '.cjs'].includes(extname(filename))) {
    exit(EWorkerThreadChildExitCode.FILE_EXTENSION_ERROR);
  }
  try {
    statSync(filename);
  } catch (e: unknown) {
    exit(EWorkerThreadChildExitCode.FILE_READ_ERROR, e);
  }
  import(filename)
    .then((importedModule: { default?: TWorkerFunction } | TWorkerFunction) => {
      const fn =
        typeof importedModule !== 'function' && importedModule.default
          ? importedModule.default
          : importedModule;
      if (typeof fn !== 'function') {
        exit(EWorkerThreadChildExitCode.INVALID_WORKER_TYPE);
      } else cb(fn);
    })
    .catch(() => {
      exit(EWorkerThreadChildExitCode.FILE_IMPORT_ERROR);
    });
}

function isRunnableFunctionFactory(
  worker: TWorkerFunction,
  type: EWorkerType,
): worker is TWorkerRunnableFunctionFactory {
  return type === EWorkerType.RUNNABLE;
}

if (!isMainThread && parentPort) {
  const { filename, type, initialPayload }: Partial<IWorkerThreadData> =
    typeof workerData === 'object' ? workerData : {}; // type-coverage:ignore-line
  if (
    !filename ||
    type === null ||
    type === undefined ||
    ![EWorkerType.CALLABLE, EWorkerType.RUNNABLE].includes(type)
  ) {
    exit(EWorkerThreadChildExitCode.WORKER_DATA_REQUIRED);
  } else {
    const messagePort: MessagePort = parentPort;
    importWorkerInstance(filename, (worker) => {
      if (isRunnableFunctionFactory(worker, type))
        handleWorkerRunnable(worker, messagePort, initialPayload);
      else handleWorkerCallable(worker, messagePort);
    });
  }
  process.on('uncaughtException', (err) => {
    exit(EWorkerThreadChildExitCode.UNCAUGHT_EXCEPTION, err);
  });
}
