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
  WorkerAlreadyDownError,
  WorkerAlreadyRunningError,
  WorkerRunnable,
} from '../../src/worker/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

const dir = env.getCurrentDir();

it('WorkerRunnable', async () => {
  const filename = resolve(dir, './workers/runnable/runnable1.worker.js');
  const worker = bluebird.promisifyAll(
    new WorkerRunnable<string>(filename, '', getDummyLogger()),
  );
  // will emit an error upon shutdown
  worker.on('worker.error', (err) => {
    console.error(err);
  });
  await worker.runAsync();

  await expect(async () => worker.runAsync()).rejects.toThrow(
    WorkerAlreadyRunningError,
  );

  await worker.shutdownAsync();

  await expect(async () => worker.shutdownAsync()).rejects.toThrow(
    WorkerAlreadyDownError,
  );
});
