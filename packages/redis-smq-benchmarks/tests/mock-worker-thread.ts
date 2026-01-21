/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { Mock, vi } from 'vitest';
import { IWorkerData } from '../src/types/index.js';

export async function mockWorkerThread(
  filename: string,
  workerData: IWorkerData,
) {
  const postMessageMock: Mock = vi.fn();
  const onMock: Mock = vi.fn();
  const parentPort = {
    postMessage: postMessageMock,
    on: onMock,
  };
  await esmock(
    filename,
    {},
    {
      worker_threads: {
        isMainThread: false,
        parentPort,
        workerData,
      },
    },
  );
  return { parentPort };
}
