/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { shutDownConsumers } from './consumer';
import { shutDownProducers } from './producer';
import { stopScheduleWorker } from './schedule-worker';
import { shutDownRedisClients } from './redis';
import { disconnect } from '../..';
import { promisify } from 'util';

const disconnectAsync = promisify(disconnect);

export async function shutdown(): Promise<void> {
  await shutDownConsumers();
  await shutDownProducers();
  await stopScheduleWorker();
  await disconnectAsync();

  // Redis clients should be stopped in the last step, to avoid random errors from different
  // dependant components.
  await shutDownRedisClients();
}
