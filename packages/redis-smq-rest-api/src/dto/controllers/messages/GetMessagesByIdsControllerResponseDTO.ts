/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageTransferable } from 'redis-smq';
import { TErrors } from '../../../errors/types/index.js';

export type GetMessagesByIdsControllerResponseDTO =
  | readonly [200, IMessageTransferable[]]
  | TErrors['MessageMessageNotFoundError'];
