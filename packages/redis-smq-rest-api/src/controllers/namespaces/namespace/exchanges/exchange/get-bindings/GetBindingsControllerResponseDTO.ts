/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from 'redis-smq';
import { TErrors } from '../../../../../../errors/errors.js';

export type GetBindingsControllerResponseDTO =
  | readonly [200, IQueueParams[] | { [routingKey: string]: IQueueParams[] }]
  | TErrors['InvalidExchangeParametersError']
  | TErrors['InvalidDirectExchangeParametersError']
  | TErrors['InvalidTopicExchangeParamsError'];
