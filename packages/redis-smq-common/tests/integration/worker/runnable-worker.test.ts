/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import {
  RunnableWorker,
  WorkerAlreadyDownError,
  WorkerAlreadyRunningError,
} from '../../../src/worker/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';

const dir = env.getCurrentDir();

function makeWorker() {
  const worker = bluebird.promisifyAll(
    new RunnableWorker<string>(
      resolve(dir, './workers/runnable/runnable1.worker.js'),
      '',
      getDummyLogger(),
    ),
  );
  // Fixture emits an error on shutdown; swallow it. The test asserts the
  // state-machine behavior, not the shutdown error path.
  worker.on('worker.error', () => undefined);
  return worker;
}

describe('RunnableWorker', () => {
  it('starts and stops cleanly', async () => {
    const worker = makeWorker();
    await worker.runAsync();
    await worker.shutdownAsync();
  });

  it('rejects run() while already running', async () => {
    const worker = makeWorker();
    await worker.runAsync();
    await expect(worker.runAsync()).rejects.toThrow(WorkerAlreadyRunningError);
    await worker.shutdownAsync();
  });

  it('rejects shutdown() while already stopped', async () => {
    const worker = makeWorker();
    await worker.runAsync();
    await worker.shutdownAsync();
    await expect(worker.shutdownAsync()).rejects.toThrow(
      WorkerAlreadyDownError,
    );
  });
});
