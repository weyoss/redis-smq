/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { randomUUID } from 'node:crypto';
import type { IQueueParams } from '../../../src/index.js';
import { PublishScheduledWorker } from '../../../src/core/consumer/workers/publish-scheduled.worker.js';
import { redisConfig, testConfig } from '../config/test-config.js';
import bluebird from 'bluebird';

type TWorkerOptions = ConstructorParameters<typeof PublishScheduledWorker>[0];

const workers = new Map<
  string,
  ReturnType<typeof bluebird.promisifyAll<PublishScheduledWorker>>
>();

function keyOf(queue: IQueueParams): string {
  return `${queue.ns}:${queue.name}`;
}

export async function startScheduleWorker(queue: IQueueParams): Promise<void> {
  const key = keyOf(queue);
  if (workers.has(key)) return;

  const options: TWorkerOptions = {
    config: testConfig,
    redisConfig,
    queueParsedParams: { queueParams: queue, groupId: null },
    loggerContext: { namespaces: [`schedule-worker:${key}`] },
    consumerId: randomUUID(),
  };

  const worker = bluebird.promisifyAll(new PublishScheduledWorker(options));
  await worker.runAsync();
  workers.set(key, worker);
}

export async function stopAllScheduleWorkers(): Promise<void> {
  const entries = [...workers.entries()];
  workers.clear();

  await Promise.all(entries.map(([, worker]) => worker.shutdownAsync()));
}
