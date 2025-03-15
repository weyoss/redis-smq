/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueRateLimit } from 'redis-smq';
import { TErrors } from '../../../errors/types/index.js';

export type SetQueueRateLimitControllerResponseDTO =
  | readonly [200, IQueueRateLimit]
  | TErrors['QueueQueueNotFoundError']
  | TErrors['QueueRateLimitQueueNotFoundError'];
