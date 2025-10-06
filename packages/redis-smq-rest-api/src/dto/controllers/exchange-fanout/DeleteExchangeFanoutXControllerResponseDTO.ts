/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/errors.js';

export type DeleteExchangeFanoutXControllerResponseDTO =
  | readonly [204, null]
  | TErrors['InvalidFanoutExchangeParametersError']
  | TErrors['ExchangeHasBoundQueuesError'];
