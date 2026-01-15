/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { PublishScheduledWorker } from '../../src/consumer/message-handler/workers/publish-scheduled.worker.js';
import { IQueueParams } from '../../src/index.js';
import { config } from './config.js';

const scheduleWorker: Record<string, PublishScheduledWorker> = {};

export async function startScheduleWorker(
  queueParams: IQueueParams,
): Promise<void> {
  const key = `${queueParams.ns}${queueParams.name}`;
  if (!scheduleWorker[key]) {
    scheduleWorker[key] = new PublishScheduledWorker({
      config,
      queueParsedParams: {
        queueParams,
        groupId: null,
      },
      loggerContext: { namespaces: [] },
    });
    await bluebird.promisifyAll(scheduleWorker[key]).runAsync();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  for (const key in scheduleWorker) {
    await bluebird.promisifyAll(scheduleWorker[key]).shutdownAsync();
    delete scheduleWorker[key];
  }
}
