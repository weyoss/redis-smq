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
  CallableWorker,
  WorkerPayloadRequiredError,
} from '../../src/worker/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

const dir = env.getCurrentDir();

it('CallableWorker: case 1', async () => {
  const filename = resolve(dir, './workers/worker-ok.worker.js');
  const worker = bluebird.promisifyAll(
    new CallableWorker<string | null, string>(filename, getDummyLogger()),
  );
  const reply = await worker.callAsync('Hello world!');
  expect(reply).toEqual('Hello world!');

  await expect(async () => worker.callAsync(null)).rejects.toThrow(
    WorkerPayloadRequiredError,
  );

  await worker.shutdownAsync();

  // second timer is OK
  await worker.shutdownAsync();
});
