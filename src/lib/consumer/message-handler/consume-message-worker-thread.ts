/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  isMainThread,
  parentPort,
  workerData, // type-coverage:ignore-line
  MessagePort,
} from 'worker_threads';
import {
  IMessageTransferable,
  TConsumerMessageHandlerFn,
} from '../../../../types';

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

function getHandlerFn(
  filename: string,
  cb: (fn: TConsumerMessageHandlerFn) => void,
) {
  import(filename)
    .then(
      (
        importedModule:
          | { default?: TConsumerMessageHandlerFn }
          | TConsumerMessageHandlerFn,
      ) => {
        const fn =
          typeof importedModule !== 'function' && importedModule.default
            ? importedModule.default
            : importedModule;
        if (typeof fn !== 'function') {
          exit(EWorkerThreadMessageCodeExit.INVALID_HANDLER_TYPE);
        } else cb(fn);
      },
    )
    .catch((err: unknown) => {
      console.error(err);
      exit(EWorkerThreadMessageCodeExit.HANDLER_IMPORT_ERROR);
    });
}

function formatMessage(
  code: TWorkerThreadMessageCode,
  err?: unknown,
): TWorkerThreadMessage {
  const error =
    err && err instanceof Error
      ? { name: err.name, message: err.message }
      : null;
  return {
    code,
    error,
  };
}

function postMessage(
  messagePort: MessagePort,
  code: TWorkerThreadMessageCode,
  err?: unknown,
) {
  const msg = formatMessage(code, err);
  messagePort.postMessage(msg);
}

function exit(code: TWorkerThreadMessageCode, err?: unknown) {
  parentPort && postMessage(parentPort, code, err);
  process.exit(code);
}

if (!isMainThread && parentPort) {
  const messagePort: MessagePort = parentPort;

  // type-coverage:ignore-next-line
  if (!workerData) {
    exit(EWorkerThreadMessageCodeExit.WORKER_DATA_REQUIRED);
  }

  getHandlerFn(workerData, (handlerFn) => {
    messagePort.on('message', (msg: IMessageTransferable) => {
      try {
        handlerFn(msg, (err) => {
          if (err) {
            postMessage(
              messagePort,
              EWorkerThreadMessageCodeConsume.MESSAGE_PROCESSING_ERROR,
              err,
            );
          } else {
            postMessage(messagePort, EWorkerThreadMessageCodeConsume.OK);
          }
        });
      } catch (err: unknown) {
        postMessage(
          messagePort,
          EWorkerThreadMessageCodeConsume.MESSAGE_PROCESSING_CAUGHT_ERROR,
          err,
        );
      }
    });
  });

  process.on('uncaughtException', (err) => {
    exit(EWorkerThreadMessageCodeExit.UNCAUGHT_EXCEPTION, err);
  });
}
