/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { ClearQueueRateLimitControllerRequestPathDTO } from './ClearQueueRateLimitControllerRequestPathDTO.js';
import type { ClearQueueRateLimitControllerResponseDTO } from './ClearQueueRateLimitControllerResponseDTO.js';

export const clearQueueRateLimit: Controller<
  PathInput<ClearQueueRateLimitControllerRequestPathDTO>,
  ClearQueueRateLimitControllerResponseDTO
> = async (deps, input) => {
  await deps.queueRateLimit.clear({
    ns: input.path.ns,
    name: input.path.name,
  });
  return [204, null];
};
