/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/errors.js';

export type DeleteExchangeDirectXControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidExchangeParametersError']
  | TErrors['ExchangeHasBoundQueuesError']
  | TErrors['ExchangeNotFoundError']
  | TErrors['ExchangeTypeMismatchError'];
