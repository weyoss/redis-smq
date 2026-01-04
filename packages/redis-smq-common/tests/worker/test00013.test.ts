/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { it } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../src/env/index.js';
import { WorkerResourceGroup } from '../../src/worker/index.js';
import { getRedisInstance } from '../common.js';
import { getDummyLogger } from '../../src/logger/index.js';

const dir = env.getCurrentDir();

it('WorkerResourceGroup: loadFromDir()', async () => {
  const redisClient = await getRedisInstance();
  const workerRunnableResourceGroup = bluebird.promisifyAll(
    new WorkerResourceGroup(redisClient, getDummyLogger(), 'mygroupid'),
  );

  const workersPath = resolve(dir, './workers/runnable');
  await workerRunnableResourceGroup.loadFromDirAsync(
    workersPath,
    'hello world',
  );
  await workerRunnableResourceGroup.runAsync();
  await bluebird.delay(10000);
  await workerRunnableResourceGroup.shutdownAsync();
});
