/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Worker } from 'worker_threads';
import { IWorkerData, IWorkerMessage } from '../types/index.js';
import { IQueueParams } from 'redis-smq';
import { IRedisConfig } from 'redis-smq-common';

export function createWorker(params: {
  workerId: number;
  workerPath: string;
  queue: IQueueParams;
  expectedMessages: number;
  redisConfig: IRedisConfig;
  onMessage: (message: IWorkerMessage) => void;
}) {
  //
  const { queue, workerId, expectedMessages, redisConfig } = params;
  const workerData: IWorkerData = {
    redisConfig,
    queue,
    workerId,
    expectedMessages,
  };

  //
  const w = new Worker(params.workerPath, {
    workerData,
    stdout: true,
    stderr: true,
  });

  // Pipe worker output to main process
  //w.stdout.pipe(process.stdout);
  //w.stderr.pipe(process.stderr);

  w.on('message', params.onMessage);

  w.on('error', (e) => {
    console.error('Worker thread error:', e);
  });

  w.on('exit', (code) => {
    console.warn(`Worker exited with code ${code}`);
  });

  return w;
}
