/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../src/env/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadParentMessage,
  EWorkerType,
  TWorkerThreadParentMessage,
} from '../../src/worker/index.js';
import { mockWorkerThread } from './mock-worker-thread.js';

it('CallableWorker: case 3', async () => {
  const dir = env.getCurrentDir();
  const { parentPort, mockExit } = await mockWorkerThread({
    filename: resolve(dir, './workers/worker-ok.worker.js'),
    type: EWorkerType.CALLABLE,
  });

  await bluebird.delay(5000);

  const message: TWorkerThreadParentMessage = {
    type: EWorkerThreadParentMessage.CALL,
    payload: '123456',
  };
  parentPort.emit('message', message);

  await bluebird.delay(5000);

  expect(parentPort.postMessage).toHaveBeenCalledTimes(1);
  expect(parentPort.postMessage).toHaveBeenCalledWith({
    code: EWorkerThreadChildExecutionCode.OK,
    data: message.payload,
  });

  expect(mockExit).toHaveBeenCalledTimes(0);
});
