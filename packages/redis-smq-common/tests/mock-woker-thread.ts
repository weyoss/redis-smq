/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { vitest } from 'vitest';
import { EventEmitter } from 'events';

export async function mockWorkerThread() {
  const mocked = await vitest.hoisted(async () => {
    const { EventEmitter } = await import('events');
    const parentPort: EventEmitter & { postMessage?: () => void } =
      new EventEmitter();
    parentPort.postMessage = vitest.fn();
    const workerData: { filename?: string; type?: number } = {
      filename: '',
      type: 0,
    };
    const setWorkerData = (data: typeof workerData) => {
      workerData.filename = data.filename ?? '';
      workerData.type = data.type ?? 0;
    };
    return { isMainThread: false, parentPort, workerData, setWorkerData };
  });

  vitest.mock('worker_threads', () => {
    return mocked;
  });

  return mocked;
}
