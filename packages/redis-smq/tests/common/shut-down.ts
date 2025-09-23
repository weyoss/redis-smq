/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { shutDownConsumers } from './consumer.js';
import { shutDownProducers } from './producer.js';
import { stopScheduleWorker } from './schedule-worker.js';
import { RedisSMQ } from '../../src/index.js';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

export async function shutdown(): Promise<void> {
  await shutDownConsumers();
  await shutDownProducers();
  await stopScheduleWorker();

  //
  await RedisSMQAsync.shutdownAsync();
}
