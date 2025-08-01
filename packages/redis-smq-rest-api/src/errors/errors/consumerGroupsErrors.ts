/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const consumerGroupsErrors = {
  ConsumerGroupsError: [500, 'ConsumerGroupsError'],
  ConsumerGroupsQueueNotFoundError: [404, 'ConsumerGroupsQueueNotFoundError'],
  ConsumerGroupsInvalidGroupIdError: [422, 'ConsumerGroupsInvalidGroupIdError'],
  ConsumerGroupsConsumerGroupNotEmptyError: [
    403,
    'ConsumerGroupsConsumerGroupNotEmptyError',
  ],
  ConsumerGroupsConsumerGroupsNotSupportedError: [
    400,
    'ConsumerGroupsConsumerGroupsNotSupportedError',
  ],
} as const;
