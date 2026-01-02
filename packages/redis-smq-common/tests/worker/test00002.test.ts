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
import { WorkerCallable } from '../../src/worker/index.js';

const dir = env.getCurrentDir();

const check = async (fn: () => Promise<unknown>, expected: string) => {
  let str = '';
  try {
    await fn();
  } catch (e: unknown) {
    str = JSON.stringify(e);
  }
  expect(str).toContain(expected);
};

it('WorkerCallable: case 2', async () => {
  const filename = resolve(dir, './workers/worker-non-existent.worker.js');
  const worker = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename),
  );

  await check(() => worker.callAsync('Hello world!'), '"code":105');

  await bluebird.delay(1000);

  await check(() => worker.callAsync('Hello world!'), '"code":105');

  const filename2 = resolve(dir, './workers/worker-non-existent.worker.jsc');
  const worker2 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename2),
  );
  await check(() => worker2.callAsync('Hello world!'), '"code":104');

  const filename3 = resolve(dir, './workers/worker-error.worker.js');
  const worker3 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename3),
  );
  await check(() => worker3.callAsync('Hello world!'), '"code":201');
  await worker3.shutdownAsync();

  const filename4 = resolve(dir, './workers/worker-exception.worker.js');
  const worker4 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename4),
  );
  await check(() => worker4.callAsync('Hello world!'), '"code":202');
  await worker4.shutdownAsync();

  const filename5 = resolve(dir, './workers/worker-faulty.worker.js');
  const worker5 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename5),
  );
  await check(() => worker5.callAsync('Hello world!'), '"code":101');

  const filename6 = resolve(dir, './workers/worker-faulty-exit.worker.js');
  const worker6 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename6),
  );
  await check(() => worker6.callAsync('Hello world!'), '"code":106');
});
