/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const queueRateErrors = {
  QueueRateLimitInvalidIntervalError: [
    400,
    'QueueRateLimitInvalidIntervalError',
  ],
  QueueRateLimitInvalidLimitError: [400, 'QueueRateLimitInvalidLimitError'],
  QueueRateLimitQueueNotFoundError: [400, 'QueueRateLimitQueueNotFoundError'],
} as const;
