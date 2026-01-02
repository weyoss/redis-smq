/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/errors.js';

export type BindQueueTopicXControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidQueueParametersError']
  | TErrors['InvalidExchangeParametersError']
  | TErrors['InvalidTopicBindingPatternError']
  | TErrors['QueueNotFoundError']
  | TErrors['ExchangeNotFoundError']
  | TErrors['NamespaceMismatchError']
  | TErrors['ExchangeTypeMismatchError']
  | TErrors['ExchangeQueuePolicyMismatchError'];
