/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { PublishScheduledWorker } from '../../src/consumer/message-handler/queue-workers/workers/publish-scheduled.worker.js';
import { IQueueParams } from '../../src/index.js';
import { config, redisConfig } from './config.js';

const scheduleWorker: Record<string, PublishScheduledWorker> = {};

export async function startScheduleWorker(
  queueParams: IQueueParams,
  consumerId: string,
): Promise<void> {
  const key = `${queueParams.ns}${queueParams.name}`;
  if (!scheduleWorker[key]) {
    scheduleWorker[key] = new PublishScheduledWorker({
      config,
      redisConfig,
      queueParsedParams: {
        queueParams,
        groupId: null,
      },
      loggerContext: { namespaces: [] },
      consumerId,
    });
    await scheduleWorker[key].run();
  }
}

export async function stopScheduleWorker(): Promise<void> {
  for (const key in scheduleWorker) {
    await scheduleWorker[key].shutdown();
    delete scheduleWorker[key];
  }
}
