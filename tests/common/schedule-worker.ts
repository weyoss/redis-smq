/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Runnable } from 'redis-smq-common';
import { Configuration } from '../../src/config/index.js';
import PublishScheduledWorker from '../../src/lib/consumer/workers/publish-scheduled.worker.js';

let scheduleWorker: Runnable<Record<string, never>> | null = null;

export async function startScheduleWorker(): Promise<void> {
  if (!scheduleWorker) {
    scheduleWorker = PublishScheduledWorker(Configuration.getSetConfig());
    await bluebird.promisifyAll(scheduleWorker).runAsync();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  if (scheduleWorker) {
    await bluebird.promisifyAll(scheduleWorker).shutdownAsync();
    scheduleWorker = null;
  }
}
