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
import { Configuration, IRedisSMQParsedConfig } from '../../src/index.js';
import PublishScheduledWorker from '../../src/consumer/workers/publish-scheduled.worker.js';
import { IQueueParams } from '../../src/index.js';

const scheduleWorker: Record<string, Runnable<Record<string, never>>> = {};

export async function startScheduleWorker(
  queueParams: IQueueParams,
  config?: IRedisSMQParsedConfig,
): Promise<void> {
  const key = `${queueParams.ns}${queueParams.name}`;
  if (!scheduleWorker[key]) {
    scheduleWorker[key] = PublishScheduledWorker({
      queueParsedParams: { queueParams, groupId: null },
      config: config ?? Configuration.getSetConfig(),
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
