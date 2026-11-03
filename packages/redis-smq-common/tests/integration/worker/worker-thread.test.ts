/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, test } from 'vitest';
import { resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadChildExitCode,
  EWorkerThreadParentMessage,
  EWorkerType,
} from '../../../src/worker/index.js';
import { mockWorkerThread, settle, waitFor } from './mock-worker-thread.js';

const dir = env.getCurrentDir();
const fixture = (name: string) => resolve(dir, `./workers/${name}`);

interface Case {
  name: string;
  workerData: { filename?: string; type?: EWorkerType } | '';
  /** When set, `postMessage` must be called exactly once with this value. */
  expectedPostMessage?: unknown;
  /** One entry per expected `process.exit()` call, in order. */
  expectedExits: number[];
}

const cases: Case[] = [
  {
    name: 'succeeds and forwards the payload',
    workerData: {
      filename: fixture('worker-ok.worker.js'),
      type: EWorkerType.CALLABLE,
    },
    expectedPostMessage: {
      code: EWorkerThreadChildExecutionCode.OK,
      data: '123456',
    },
    expectedExits: [],
  },
  {
    name: 'forwards a callback error as PROCESSING_ERROR',
    workerData: {
      filename: fixture('worker-error.worker.js'),
      type: EWorkerType.CALLABLE,
    },
    expectedPostMessage: {
      code: EWorkerThreadChildExecutionCode.PROCESSING_ERROR,
      error: { name: 'Error', message: 'MY_ERROR' },
    },
    expectedExits: [],
  },
  {
    name: 'forwards a thrown error as PROCESSING_CAUGHT_ERROR',
    workerData: {
      filename: fixture('worker-exception.worker.js'),
      type: EWorkerType.CALLABLE,
    },
    expectedPostMessage: {
      code: EWorkerThreadChildExecutionCode.PROCESSING_CAUGHT_ERROR,
      error: { name: 'Error', message: 'THROW_ERROR' },
    },
    expectedExits: [],
  },
  {
    name: 'exits with INVALID_WORKER_TYPE when the default export is not a function',
    workerData: {
      filename: fixture('worker-faulty.worker.js'),
      type: EWorkerType.CALLABLE,
    },
    expectedPostMessage: {
      code: EWorkerThreadChildExitCode.INVALID_WORKER_TYPE,
      error: null,
    },
    expectedExits: [EWorkerThreadChildExitCode.INVALID_WORKER_TYPE],
  },
  {
    // Fixture calls process.exit(333) at import time. Because process.exit
    // is mocked, execution continues; getHandlerFn() then runs with a
    // non-function export and exits again with INVALID_WORKER_TYPE.
    name: 'exits with 333 then INVALID_WORKER_TYPE when the fixture self-exits',
    workerData: {
      filename: fixture('worker-faulty-exit.worker.js'),
      type: EWorkerType.CALLABLE,
    },
    expectedExits: [333, EWorkerThreadChildExitCode.INVALID_WORKER_TYPE],
  },
  {
    name: 'exits with WORKER_DATA_REQUIRED when workerData is empty',
    workerData: '',
    expectedPostMessage: {
      code: EWorkerThreadChildExitCode.WORKER_DATA_REQUIRED,
      error: null,
    },
    expectedExits: [EWorkerThreadChildExitCode.WORKER_DATA_REQUIRED],
  },
  {
    name: 'exits with FILE_READ_ERROR then FILE_IMPORT_ERROR for a missing .js file',
    workerData: {
      filename: fixture('worker-non-existent.js'),
      type: EWorkerType.CALLABLE,
    },
    expectedExits: [
      EWorkerThreadChildExitCode.FILE_READ_ERROR,
      EWorkerThreadChildExitCode.FILE_IMPORT_ERROR,
    ],
  },
  {
    name: 'exits with FILE_EXTENSION_ERROR, FILE_READ_ERROR, FILE_IMPORT_ERROR for an unsupported extension',
    workerData: {
      filename: fixture('worker-non-existent.cjsx'),
      type: EWorkerType.CALLABLE,
    },
    expectedExits: [
      EWorkerThreadChildExitCode.FILE_EXTENSION_ERROR,
      EWorkerThreadChildExitCode.FILE_READ_ERROR,
      EWorkerThreadChildExitCode.FILE_IMPORT_ERROR,
    ],
  },
];

describe('worker-thread module', () => {
  test.each(cases)('$name', async (c) => {
    const { parentPort, mockExit } = await mockWorkerThread(c.workerData);
    // Small pre-emit buffer for module init.
    await settle(50);

    parentPort.emit('message', {
      type: EWorkerThreadParentMessage.CALL,
      payload: '123456',
    });

    // Wait until the exit count reaches its expected value; for cases with
    // an expected reply, also wait for that reply to land.
    await waitFor(
      () =>
        mockExit.mock.calls.length >= c.expectedExits.length &&
        (!c.expectedPostMessage ||
          parentPort.postMessage.mock.calls.length >= 1),
    );

    expect(mockExit).toHaveBeenCalledTimes(c.expectedExits.length);
    c.expectedExits.forEach((code, idx) => {
      expect(mockExit).toHaveBeenNthCalledWith(idx + 1, code);
    });

    // `postMessage` is only asserted for cases where the expected value is
    // known. The exit-only paths also post error messages, but their exact
    // shape is not part of the contract this table pins down.
    if (c.expectedPostMessage !== undefined) {
      expect(parentPort.postMessage).toHaveBeenCalledTimes(1);
      expect(parentPort.postMessage).toHaveBeenCalledWith(
        c.expectedPostMessage,
      );
    }
  });
});
