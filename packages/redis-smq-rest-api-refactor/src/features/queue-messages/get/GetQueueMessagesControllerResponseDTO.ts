/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IBrowserPage, IMessageTransferable } from 'redis-smq';
import type { TErrors } from '../../../errors/index.js';

export type GetQueueMessagesControllerResponseDTO =
  | readonly [200, IBrowserPage<IMessageTransferable>]
  | TErrors['InvalidQueueParametersError']
  | TErrors['ConsumerGroupRequiredError']
  | TErrors['ConsumerGroupsNotSupportedError']
  | TErrors['QueueNotFoundError']
  | TErrors['AcknowledgmentAuditDisabledError']
  | TErrors['DeadLetterAuditDisabledError'];
