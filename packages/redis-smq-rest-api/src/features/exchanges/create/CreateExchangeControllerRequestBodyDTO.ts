/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type {
  EExchangeQueuePolicy,
  EExchangeType,
  IExchangeParams,
} from 'redis-smq';

export type CreateExchangeControllerRequestBodyDTO = {
  exchange: IExchangeParams;
  type: EExchangeType;
  queuePolicy: EExchangeQueuePolicy;
};
