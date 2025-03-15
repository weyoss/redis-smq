/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TErrors } from '../../../errors/types/index.js';

export type RequeueMessageByIdControllerResponseDTO =
  | readonly [204, null]
  | TErrors['MessageMessageNotFoundError']
  | TErrors['MessageMessageNotRequeuableError']
  | TErrors['MessageInvalidParametersError'];
