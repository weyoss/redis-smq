/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueueParams } from 'redis-smq';
import type { Controller, RequestInput } from '../../../http/index.js';

/**
 * Returns every queue the runtime knows about.
 *
 * Straight projection of `deps.queueManager.getQueues()` into the
 * response tuple — no transformation, no filtering, no envelope. The
 * router applies `{ data }`.
 */
export const getAllQueues: Controller<RequestInput, IQueueParams[]> = async (
  deps,
) => {
  const queues = await deps.queueManager.getQueues();
  return [200, queues];
};
