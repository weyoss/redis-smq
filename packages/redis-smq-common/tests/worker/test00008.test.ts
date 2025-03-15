/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import {
  EWorkerThreadChildExitCode,
  EWorkerThreadParentMessage,
} from '../../src/worker/index.js';
import { mockWorkerThread } from './mock-worker-thread.js';

it('WorkerCallable: case 8', async () => {
  const { parentPort, mockExit } = await mockWorkerThread('');

  await bluebird.delay(5000);

  parentPort.emit('message', {
    type: EWorkerThreadParentMessage.CALL,
    payload: '123456',
  });

  await bluebird.delay(5000);

  // In real world the thread would exit when workerData is empty
  // But process.exit is mocked so getHandlerFn() is called with empty workerData
  expect(parentPort.postMessage).toHaveBeenCalledTimes(1);
  expect(parentPort.postMessage).toHaveBeenNthCalledWith(1, {
    code: EWorkerThreadChildExitCode.WORKER_DATA_REQUIRED,
    error: null,
  });

  // In real world the thread would exit when workerData is empty
  // But process.exit is mocked so getHandlerFn() is called with empty workerData

  expect(mockExit).toHaveBeenCalledTimes(1);

  expect(mockExit).toHaveBeenNthCalledWith(
    1,
    EWorkerThreadChildExitCode.WORKER_DATA_REQUIRED,
  );
});
