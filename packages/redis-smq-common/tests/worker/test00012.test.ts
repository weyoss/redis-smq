/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { it } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { getDirname } from '../../src/env/index.js';
import { WorkerResourceGroup } from '../../src/worker/index.js';
import { getRedisInstance } from '../common.js';

const dir = getDirname();

it('WorkerResourceGroup: addWorker()', async () => {
  const redisClient = await getRedisInstance();
  const workerRunnableResourceGroup = bluebird.promisifyAll(
    new WorkerResourceGroup(redisClient, console, 'mygroupid'),
  );

  const filename = resolve(dir, './workers/runnable/runnable1.worker.js');
  workerRunnableResourceGroup.addWorker(filename, 'hello world');
  await workerRunnableResourceGroup.runAsync();

  await bluebird.delay(10000);

  await workerRunnableResourceGroup.shutdownAsync();
});
