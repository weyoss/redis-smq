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
import { resolve } from 'node:path';
import { env } from '../../src/env/index.js';
import {
  EWorkerThreadChildExitCode,
  EWorkerThreadParentMessage,
  EWorkerType,
} from '../../src/worker/index.js';
import { mockWorkerThread } from './mock-worker-thread.js';

it('WorkerCallable: case 9', async () => {
  const dir = env.getCurrentDir();
  const { parentPort, mockExit } = await mockWorkerThread({
    filename: resolve(dir, './workers/worker-non-existent.js'),
    type: EWorkerType.CALLABLE,
  });

  await bluebird.delay(5000);

  parentPort.emit('message', {
    type: EWorkerThreadParentMessage.CALL,
    payload: '123456',
  });

  await bluebird.delay(5000);

  // In real world the thread would exit when the file has been imported
  // But process.exit is mocked so the code continues execution

  expect(mockExit).toHaveBeenCalledTimes(2);

  expect(mockExit).toHaveBeenNthCalledWith(
    1,
    EWorkerThreadChildExitCode.FILE_READ_ERROR,
  );

  expect(mockExit).toHaveBeenNthCalledWith(
    2,
    EWorkerThreadChildExitCode.FILE_IMPORT_ERROR,
  );
});
