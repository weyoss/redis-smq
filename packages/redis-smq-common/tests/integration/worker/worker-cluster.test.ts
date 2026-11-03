/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import { WorkerCluster } from '../../../src/worker/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { getRedisInstance } from '../../helpers/common.js';

const dir = env.getCurrentDir();
const GROUP_ID = 'mygroupid';
const SMOKE_MS = 100;

async function makeCluster() {
  const redisClient = await getRedisInstance();
  return bluebird.promisifyAll(
    new WorkerCluster(redisClient, getDummyLogger(), GROUP_ID),
  );
}

describe('WorkerCluster', () => {
  it('addWorker() registers and runs a single worker', async () => {
    const cluster = await makeCluster();
    cluster.addWorker(
      resolve(dir, './workers/runnable/runnable1.worker.js'),
      'hello world',
    );
    await cluster.runAsync();
    await bluebird.delay(SMOKE_MS);
    await cluster.shutdownAsync();
  });

  it('loadFromDir() registers every runnable worker in a directory', async () => {
    const cluster = await makeCluster();
    await cluster.loadFromDirAsync(
      resolve(dir, './workers/runnable'),
      'hello world',
    );
    await cluster.runAsync();
    await bluebird.delay(SMOKE_MS);
    await cluster.shutdownAsync();
  });
});
