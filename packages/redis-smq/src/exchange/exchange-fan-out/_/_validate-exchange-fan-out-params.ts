/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { ExchangeInvalidFanOutParamsError } from '../../errors/index.js';

export function _validateExchangeFanOutParams(
  fanOutName: string,
): string | ExchangeInvalidFanOutParamsError {
  const name = redisKeys.validateRedisKey(fanOutName);
  if (name instanceof Error) return new ExchangeInvalidFanOutParamsError();
  return name;
}
