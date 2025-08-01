/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const messageErrors = {
  MessageDestinationQueueAlreadySetError: [
    500,
    'MessageDestinationQueueAlreadySetError',
  ],
  MessageDestinationQueueRequiredError: [
    400,
    'MessageDestinationQueueRequiredError',
  ],
  MessageInvalidParametersError: [500, 'MessageInvalidParametersError'],
  MessageMessageExchangeRequiredError: [
    400,
    'MessageMessageExchangeRequiredError',
  ],
  MessageMessageInProcessError: [403, 'MessageMessageInProcessError'],
  MessageMessageNotFoundError: [404, 'MessageMessageNotFoundError'],
  MessageMessageNotRequeuableError: [400, 'MessageMessageNotRequeuableError'],
  MessageMessageNotDeletedError: [500, 'MessageMessageNotDeletedError'],
  MessageMessagePropertyError: [400, 'MessageMessagePropertyError'],
  MessageError: [500, 'MessageError'],
} as const;
