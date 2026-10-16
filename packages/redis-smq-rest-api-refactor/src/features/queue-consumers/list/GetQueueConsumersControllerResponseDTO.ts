/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueueConsumer } from 'redis-smq';
import type { TErrors } from '../../../errors/index.js';

export type GetQueueConsumersControllerResponseDTO =
  | readonly [200, { [consumerId: string]: IQueueConsumer }]
  | TErrors['InvalidQueueParametersError']
  | TErrors['QueueNotFoundError'];
