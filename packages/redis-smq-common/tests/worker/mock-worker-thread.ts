/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { vitest } from 'vitest';
import { EventEmitter } from 'events';
import { resolve } from 'node:path';
import { env } from '../../src/env/index.js';
import { EWorkerType } from '../../src/worker/index.js';

export async function mockWorkerThread(
  workerData: { filename?: string; type?: EWorkerType } | '',
) {
  // @ts-expect-error any
  const mockExit = vitest.spyOn(process, 'exit').mockImplementation(() => {});
  const parentPort: EventEmitter & { postMessage?: () => void } =
    new EventEmitter();
  parentPort.postMessage = vitest.fn();
  const p = resolve(
    env.getCurrentDir(),
    '../../src/worker/worker-thread/worker-thread.js',
  );
  await esmock(
    p,
    {},
    {
      worker_threads: {
        isMainThread: false,
        parentPort,
        workerData,
      },
    },
  );
  return { mockExit, parentPort };
}
