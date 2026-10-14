/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { TErrors } from '../../../errors/index.js';

export type GetRoutingKeysControllerResponseDTO =
  | readonly [200, string[]]
  | TErrors['InvalidExchangeParametersError']
  | TErrors['InvalidDirectExchangeParametersError'];
