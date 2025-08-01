/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const producerErrors = {
  ProducerExchangeNoMatchedQueueError: [
    400,
    'ProducerExchangeNoMatchedQueueError',
  ],
  ProducerInstanceNotRunningError: [500, 'ProducerInstanceNotRunningError'],
  ProducerMessageExchangeRequiredError: [
    400,
    'ProducerMessageExchangeRequiredError',
  ],
  ProducerMessagePriorityRequiredError: [
    400,
    'ProducerMessagePriorityRequiredError',
  ],
  ProducerPriorityQueuingNotEnabledError: [
    400,
    'ProducerPriorityQueuingNotEnabledError',
  ],
  ProducerQueueMissingConsumerGroupsError: [
    400,
    'ProducerQueueMissingConsumerGroupsError',
  ],
  ProducerQueueNotFoundError: [400, 'ProducerQueueNotFoundError'],
  ProducerScheduleInvalidParametersError: [
    500,
    'ProducerScheduleInvalidParametersError',
  ],
  ProducerUnknownQueueTypeError: [500, 'ProducerUnknownQueueTypeError'],
  ProducerError: [500, 'ProducerError'],
} as const;
