/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessagePort } from 'worker_threads';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadChildExitCode,
  EWorkerThreadParentMessage,
  IWorkerRunnable,
  TWorkerRunnableClass,
  TWorkerRunnableFunctionFactory,
  TWorkerThreadParentMessage,
} from '../types/index.js';
import { exit } from './worker-thread-message.js';

function isWorkerClass(
  Worker: TWorkerRunnableFunctionFactory | TWorkerRunnableClass,
): Worker is TWorkerRunnableClass {
  return Worker.prototype && typeof Worker.prototype.constructor === 'function';
}

export function handleWorkerRunnable(
  Worker: TWorkerRunnableFunctionFactory | TWorkerRunnableClass,
  messagePort: MessagePort,
  initialPayload: unknown,
) {
  let instance: IWorkerRunnable | null = null;
  try {
    if (isWorkerClass(Worker)) instance = new Worker(initialPayload);
    else instance = Worker(initialPayload);
  } catch (err: unknown) {
    exit(EWorkerThreadChildExitCode.INVALID_WORKER_TYPE, err);
  }
  if (
    !instance ||
    typeof instance !== 'object' ||
    !instance.run ||
    !instance.shutdown
  ) {
    exit(EWorkerThreadChildExitCode.INVALID_WORKER_TYPE);
  } else {
    const run = () => {
      try {
        instance.run((err?: unknown | null) => {
          if (err) exit(EWorkerThreadChildExecutionCode.PROCESSING_ERROR, err);
        });
      } catch (err: unknown) {
        exit(EWorkerThreadChildExecutionCode.PROCESSING_CAUGHT_ERROR, err);
      }
    };
    const shutdown = () => {
      instance.shutdown(() => void 0);
    };
    const onMessage = (message: TWorkerThreadParentMessage) => {
      if (message.type === EWorkerThreadParentMessage.RUN) run();
      if (message.type === EWorkerThreadParentMessage.SHUTDOWN) shutdown();
    };
    messagePort.on('message', onMessage);
  }
}
