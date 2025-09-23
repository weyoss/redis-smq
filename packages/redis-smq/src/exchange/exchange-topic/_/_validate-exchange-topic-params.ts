/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { InvalidTopicExchangeParamsError } from '../../../errors/index.js';
import { ITopicParams } from '../../types/index.js';
import { _getTopicExchangeParams } from './_get-topic-exchange-params.js';

export function _validateExchangeTopicParams(
  topicParams: string | ITopicParams,
): ITopicParams | InvalidTopicExchangeParamsError {
  const params = _getTopicExchangeParams(topicParams);
  if (params instanceof Error) return new InvalidTopicExchangeParamsError();
  return params;
}
