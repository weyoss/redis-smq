/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const queueErrors = {
  QueueInvalidQueueParameterError: [400, 'QueueInvalidQueueParameterError'],
  QueueQueueExistsError: [400, 'QueueQueueExistsError'],
  QueueQueueHasRunningConsumersError: [
    403,
    'QueueQueueHasRunningConsumersError',
  ],
  QueueQueueNotEmptyError: [403, 'QueueQueueNotEmptyError'],
  QueueQueueNotFoundError: [404, 'QueueQueueNotFoundError'],
} as const;
