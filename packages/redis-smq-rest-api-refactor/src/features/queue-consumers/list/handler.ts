/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetQueueConsumersControllerRequestPathDTO } from './GetQueueConsumersControllerRequestPathDTO.js';
import type { GetQueueConsumersControllerResponseDTO } from './GetQueueConsumersControllerResponseDTO.js';

/**
 * Returns the live consumers registered against a queue.
 *
 * Straight projection of `queueManager.getConsumers()`. A queue with
 * no consumers returns an empty object, not an error — "no consumers"
 * is a valid state, not a failure.
 */
export const getQueueConsumers: Controller<
  PathInput<GetQueueConsumersControllerRequestPathDTO>,
  GetQueueConsumersControllerResponseDTO
> = async (deps, input) => {
  const consumers = await deps.queueManager.getConsumers({
    ns: input.path.ns,
    name: input.path.name,
  });
  return [200, consumers];
};
