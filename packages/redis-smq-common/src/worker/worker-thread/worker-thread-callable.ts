/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessagePort } from 'worker_threads';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadParentMessage,
  TWorkerCallableFunction,
  TWorkerThreadParentMessage,
} from '../types/index.js';
import { postMessage } from './worker-thread-message.js';

export function handleWorkerCallable(
  worker: TWorkerCallableFunction,
  messagePort: MessagePort,
) {
  const callback = (err?: Error | null, reply?: unknown) => {
    if (err) {
      postMessage(
        messagePort,
        EWorkerThreadChildExecutionCode.PROCESSING_ERROR,
        err,
      );
    } else {
      postMessage(messagePort, EWorkerThreadChildExecutionCode.OK, null, reply);
    }
  };
  const onMessage = (message: TWorkerThreadParentMessage) => {
    if (message.type === EWorkerThreadParentMessage.CALL) {
      const { payload } = message;
      try {
        worker(payload, callback);
      } catch (err: unknown) {
        postMessage(
          messagePort,
          EWorkerThreadChildExecutionCode.PROCESSING_CAUGHT_ERROR,
          err,
        );
      }
    }
  };
  messagePort.on('message', onMessage);
}
