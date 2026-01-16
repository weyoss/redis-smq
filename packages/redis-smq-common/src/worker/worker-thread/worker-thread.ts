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
  TWorkerDefinition,
  TRunnableWorkerClass,
  TRunnableWorkerFactory,
} from '../types/index.js';
import { handleCallableWorker } from './callable-worker-thread.js';
import { exit } from './worker-thread-message.js';
import { handleRunnableWorker } from './runnable-worker-thread.js';

function isWorkerFunction(Worker: unknown): Worker is TWorkerDefinition {
  return typeof Worker === 'function';
}

function importWorkerInstance(
  filename: string,
  cb: (worker: TWorkerDefinition) => void,
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
    .then((importedModule: unknown) => {
      const fn =
        importedModule &&
        typeof importedModule === 'object' &&
        'default' in importedModule
          ? importedModule.default
          : importedModule;
      if (!isWorkerFunction(fn)) {
        return exit(EWorkerThreadChildExitCode.INVALID_WORKER_TYPE);
      }
      cb(fn);
    })
    .catch(() => {
      exit(EWorkerThreadChildExitCode.FILE_IMPORT_ERROR);
    });
}

function isRunnableFunctionFactory(
  worker: TWorkerDefinition,
  type: EWorkerType,
): worker is TRunnableWorkerFactory | TRunnableWorkerClass {
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
        handleRunnableWorker(worker, messagePort, initialPayload);
      else handleCallableWorker(worker, messagePort);
    });
  }
  process.on('uncaughtException', (err) => {
    exit(EWorkerThreadChildExitCode.UNCAUGHT_EXCEPTION, err);
  });
}
