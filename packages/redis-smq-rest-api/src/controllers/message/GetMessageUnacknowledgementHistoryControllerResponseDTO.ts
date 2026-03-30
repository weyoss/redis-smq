/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TMessageUnacknowledgementHistory } from 'redis-smq';
import { TErrors } from '../../errors/errors.js';

export type GetMessageUnacknowledgementHistoryControllerResponseDTO =
  | readonly [200, TMessageUnacknowledgementHistory]
  | TErrors['MessageNotFoundError']
  | TErrors['UnacknowledgmentHistoryDisabledError'];
