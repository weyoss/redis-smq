/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 } from 'uuid';
import {
  EExchangeType,
  ITopicParams,
  TExchangeTopicTransferable,
} from '../../types/exchange.js';
import { _validateExchangeTopicParams } from './_validate-exchange-topic-params.js';

export function _getExchangeTopicTransferable(
  topic: string | ITopicParams,
): TExchangeTopicTransferable {
  return {
    params: _validateExchangeTopicParams(topic),
    type: EExchangeType.TOPIC,
    exchangeTag: v4(),
  };
}
