/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import { env } from '../../src/env/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadParentMessage,
  EWorkerType,
} from '../../src/worker/index.js';
import { mockWorkerThread } from './mock-worker-thread.js';

it('WorkerCallable: case 5', async () => {
  const dir = env.getCurrentDir();
  const { parentPort, mockExit } = await mockWorkerThread({
    filename: resolve(dir, './workers/worker-exception.worker.js'),
    type: EWorkerType.CALLABLE,
  });

  await bluebird.delay(5000);

  parentPort.emit('message', {
    type: EWorkerThreadParentMessage.CALL,
    payload: '123456',
  });

  await bluebird.delay(5000);

  expect(parentPort.postMessage).toHaveBeenCalledTimes(1);
  expect(parentPort.postMessage).toHaveBeenCalledWith({
    code: EWorkerThreadChildExecutionCode.PROCESSING_CAUGHT_ERROR,
    error: { name: 'Error', message: 'THROW_ERROR' },
  });

  expect(mockExit).toHaveBeenCalledTimes(0);
});
