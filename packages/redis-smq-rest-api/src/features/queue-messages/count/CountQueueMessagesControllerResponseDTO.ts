/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueuePublishedMessagesCountByStatus } from 'redis-smq';
import type { TErrors } from '../../../errors/index.js';

export type CountQueueMessagesControllerResponseDTO =
  | readonly [200, number | IQueuePublishedMessagesCountByStatus]
  | TErrors['InvalidQueueParametersError']
  | TErrors['ConsumerGroupRequiredError']
  | TErrors['ConsumerGroupsNotSupportedError']
  | TErrors['QueueNotFoundError'];
