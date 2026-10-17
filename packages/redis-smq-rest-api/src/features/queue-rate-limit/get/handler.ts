/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetQueueRateLimitControllerRequestPathDTO } from './GetQueueRateLimitControllerRequestPathDTO.js';
import type { GetQueueRateLimitControllerResponseDTO } from './GetQueueRateLimitControllerResponseDTO.js';

export const getQueueRateLimit: Controller<
  PathInput<GetQueueRateLimitControllerRequestPathDTO>,
  GetQueueRateLimitControllerResponseDTO
> = async (deps, input) => {
  const rateLimit = await deps.queueRateLimit.get({
    ns: input.path.ns,
    name: input.path.name,
  });
  return [200, rateLimit];
};
