/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import PublishScheduledWorker from '../../src/workers/publish-scheduled.worker';
import { getRedisInstance } from './redis';
import { promisifyAll } from 'bluebird';

let scheduleWorker: PublishScheduledWorker | null = null;

export async function startScheduleWorker(): Promise<void> {
  if (!scheduleWorker) {
    const redisClient = await getRedisInstance();
    scheduleWorker = new PublishScheduledWorker(redisClient, false);
    scheduleWorker.run();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  if (scheduleWorker) {
    await promisifyAll(scheduleWorker).quitAsync();
    scheduleWorker = null;
  }
}
