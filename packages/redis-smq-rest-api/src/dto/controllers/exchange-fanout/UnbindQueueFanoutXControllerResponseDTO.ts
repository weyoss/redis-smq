/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/errors.js';

export type UnbindQueueFanoutXControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidQueueParametersError']
  | TErrors['InvalidExchangeParametersError']
  | TErrors['NamespaceMismatchError']
  | TErrors['ExchangeNotFoundError']
  | TErrors['ExchangeTypeMismatchError']
  | TErrors['QueueNotBoundError'];
