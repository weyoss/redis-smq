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

it('WorkerCallable: case 2', async () => {
  const filename = resolve(dir, './workers/worker-non-existent.worker.js');
  const worker = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename),
  );

  await expect(worker.callAsync('Hello world!')).rejects.toThrow(
    'Error code: FILE_READ_ERROR',
  );

  await bluebird.delay(1000);

  await expect(worker.callAsync('Hello world!')).rejects.toThrow(
    'Error code: FILE_READ_ERROR',
  );

  const filename2 = resolve(dir, './workers/worker-non-existent.worker.jsc');
  const worker2 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename2),
  );
  await expect(worker2.callAsync('Hello world!')).rejects.toThrow(
    'Error code: FILE_EXTENSION_ERROR',
  );

  const filename3 = resolve(dir, './workers/worker-error.worker.js');
  const worker3 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename3),
  );
  await expect(worker3.callAsync('Hello world!')).rejects.toThrow(
    'Error code: PROCESSING_ERROR',
  );
  await worker3.shutdownAsync();

  const filename4 = resolve(dir, './workers/worker-exception.worker.js');
  const worker4 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename4),
  );
  await expect(worker4.callAsync('Hello world!')).rejects.toThrow(
    'Error code: PROCESSING_CAUGHT_ERROR',
  );
  await worker4.shutdownAsync();

  const filename5 = resolve(dir, './workers/worker-faulty.worker.js');
  const worker5 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename5),
  );
  await expect(worker5.callAsync('Hello world!')).rejects.toThrow(
    'Error code: INVALID_WORKER_TYPE',
  );

  const filename6 = resolve(dir, './workers/worker-faulty-exit.worker.js');
  const worker6 = bluebird.promisifyAll(
    new WorkerCallable<string, string>(filename6),
  );
  await expect(worker6.callAsync('Hello world!')).rejects.toThrow(
    'Error code: TERMINATED',
  );
});
