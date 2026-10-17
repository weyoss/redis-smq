/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { BodyInput, Controller } from '../../../http/index.js';
import type { CreateQueueControllerRequestBodyDTO } from './CreateQueueControllerRequestBodyDTO.js';
import { CreateQueueControllerResponseDTO } from './CreateQueueControllerResponseDTO.js';

/**
 * Creates a queue and returns its identity plus full properties.
 *
 * `queueManager.save` does the work; the handler is a projection of
 * the validated body into that call. Errors propagate untouched — the
 * error handler resolves them to statuses via the class-keyed map.
 */
export const createQueue: Controller<
  BodyInput<CreateQueueControllerRequestBodyDTO>,
  CreateQueueControllerResponseDTO
> = async (deps, input) => {
  const { queue, queueType, queueDeliveryModel } = input.body;
  deps.logger.debug('Creating queue', { queue });
  const result = await deps.queueManager.save(
    queue,
    queueType,
    queueDeliveryModel,
  );
  return [201, result];
};
