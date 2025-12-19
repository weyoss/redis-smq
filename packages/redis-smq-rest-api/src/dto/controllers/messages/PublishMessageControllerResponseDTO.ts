/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/errors.js';

export type PublishMessageControllerResponseDTO =
  | readonly [201, string[]]
  | TErrors['ProducerNotRunningError']
  | TErrors['MessageExchangeRequiredError']
  | TErrors['NoMatchedQueuesForMessageExchangeError']
  | TErrors['QueueHasNoConsumerGroupsError']
  | TErrors['MessagePropertyError']
  | TErrors['QueueNotFoundError']
  | TErrors['InvalidSchedulingParametersError']
  | TErrors['MessagePriorityRequiredError']
  | TErrors['PriorityQueuingNotEnabledError'];
