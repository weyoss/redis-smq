/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IExchangeParsedParams } from '../../../contracts/index.js';

/**
 * Canonicalize: sort keys so the serialization is stable regardless of how
 * the caller constructed the object.
 */
export function _stringifyExchangeParams(
  exchangeParams: IExchangeParsedParams,
): string {
  return JSON.stringify({
    name: exchangeParams.name,
    ns: exchangeParams.ns,
    type: exchangeParams.type,
  });
}
