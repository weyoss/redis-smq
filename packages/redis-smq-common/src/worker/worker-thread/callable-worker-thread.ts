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
  EWorkerThreadParentMessage,
  TCallableWorkerFunction,
  TWorkerThreadParentMessage,
} from '../types/index.js';
import { postMessage } from './worker-thread-message.js';

export function handleCallableWorker(
  worker: TCallableWorkerFunction,
  messagePort: MessagePort,
) {
  const onMessage = (message: TWorkerThreadParentMessage) => {
    if (message.type !== EWorkerThreadParentMessage.CALL) return;

    const { payload } = message;

    /**
     * Per-call reply guard.
     *
     * The callable worker protocol is strictly request-response: for each
     * `CALL` message, exactly one reply must be posted. Without this guard,
     * two classes of bugs surface:
     *
     *   1. Worker calls `callback()` then throws. Without the guard, we'd
     *      post both an `OK`/`PROCESSING_ERROR` reply *and* a
     *      `PROCESSING_CAUGHT_ERROR` reply. The parent's reply handler is
     *      registered with `once('message')`, so the first reply is
     *      consumed and the second stays queued — the *next* `call()`
     *      on the same worker would then receive the stale second reply.
     *
     *   2. Worker calls `callback()` twice (misbehaving worker). Same
     *      stale-reply problem.
     *
     * `replied` is scoped to this `onMessage` invocation, so a new `CALL`
     * message gets a fresh flag and the worker can be called sequentially
     * any number of times.
     */
    let replied = false;

    const callback = (err?: Error | null, reply?: unknown) => {
      if (replied) return;
      replied = true;

      if (err) {
        postMessage(
          messagePort,
          EWorkerThreadChildExecutionCode.PROCESSING_ERROR,
          err,
        );
      } else {
        postMessage(
          messagePort,
          EWorkerThreadChildExecutionCode.OK,
          null,
          reply,
        );
      }
    };

    try {
      worker(payload, callback);
    } catch (err: unknown) {
      // Only report the caught error if the worker has not already replied.
      // A worker that calls `callback()` and *then* throws has delivered
      // its result — the throw is a post-delivery bug in the worker, not a
      // failure of the operation. Suppressing the second reply keeps the
      // one-reply-per-call invariant intact.
      if (!replied) {
        replied = true;
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
