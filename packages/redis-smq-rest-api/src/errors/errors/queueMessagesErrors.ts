/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const queueMessagesErrors = {
  QueueExplorerConsumerGroupIdRequiredError: [
    400,
    'QueueExplorerConsumerGroupIdRequiredError',
  ],
  QueueExplorerConsumerGroupIdNotSupportedError: [
    400,
    'QueueExplorerConsumerGroupIdNotSupportedError',
  ],
} as const;
