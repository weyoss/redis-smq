/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { errors } from 'redis-smq';
import type { Controller, PathInput } from '../../../http/index.js';
import type { CheckQueueExistenceControllerRequestPathDTO } from './CheckQueueExistenceControllerRequestPathDTO.js';
import type { CheckQueueExistenceControllerResponseDTO } from './CheckQueueExistenceControllerResponseDTO.js';

/**
 * Reports whether a queue exists by status code.
 *
 * 200 → the queue exists; 400 `QueueNotFoundError` → it doesn't.
 * The handler doesn't return a payload because HEAD responses carry
 * no body; the status is the answer.
 */
export const checkQueueExistence: Controller<
  PathInput<CheckQueueExistenceControllerRequestPathDTO>,
  CheckQueueExistenceControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const exists = await deps.queueManager.exists({ ns, name });
  if (!exists) {
    throw new errors.QueueNotFoundError({ metadata: { queue: { ns, name } } });
  }
  return [200, null];
};
