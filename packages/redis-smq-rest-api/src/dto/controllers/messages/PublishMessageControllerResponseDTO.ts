/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/types/index.js';

export type PublishMessageControllerResponseDTO =
  | readonly [201, string[]]
  | TErrors['ProducerInstanceNotRunningError']
  | TErrors['ProducerMessageExchangeRequiredError']
  | TErrors['ProducerExchangeNoMatchedQueueError']
  | TErrors['ProducerQueueMissingConsumerGroupsError']
  | TErrors['MessageMessagePropertyError']
  | TErrors['ProducerQueueNotFoundError']
  | TErrors['ProducerScheduleInvalidParametersError']
  | TErrors['ProducerMessagePriorityRequiredError']
  | TErrors['ProducerPriorityQueuingNotEnabledError'];
