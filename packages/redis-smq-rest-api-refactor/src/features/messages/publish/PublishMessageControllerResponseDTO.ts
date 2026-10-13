/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { TErrors } from '../../../errors/index.js';

/**
 * Response shape of `POST /api/messages`.
 *
 * Success is a 201 with the array of produced message IDs. Depending
 * on the exchange target, a single publish can fan out to multiple
 * queues and therefore produce more than one message — the length of
 * `ids` reflects that.
 *
 * Twelve error branches, all from `TErrors`. The list mirrors the
 * original package's response DTO: every error `producer.produce()`
 * can raise, plus the validation errors that surface from the
 * exchange-target resolution.
 */
export type PublishMessageControllerResponseDTO =
  | readonly [201, string[]]
  | TErrors['ProducerNotRunningError']
  | TErrors['MessageExchangeRequiredError']
  | TErrors['RoutingKeyRequiredError']
  | TErrors['NoMatchingQueuesError']
  | TErrors['QueueHasNoConsumerGroupsError']
  | TErrors['QueueNotFoundError']
  | TErrors['ConsumerGroupNotFoundError']
  | TErrors['MessagePriorityRequiredError']
  | TErrors['MessageAlreadyExistsError']
  | TErrors['PriorityQueuingNotEnabledError']
  | TErrors['InvalidQueueTypeError']
  | TErrors['UnexpectedScriptReplyError'];
