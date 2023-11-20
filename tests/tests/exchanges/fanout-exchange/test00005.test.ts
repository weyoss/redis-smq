/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType, TExchangeSerialized } from '../../../../types';
import { ExchangeInvalidDataError } from '../../../../src/lib/exchange/errors';
import { _fromJSON } from '../../../../src/lib/exchange/_from-json';

test('ExchangeFanOut: fromJSON()', async () => {
  const json: TExchangeSerialized = {
    bindingParams: 'w123.1',
    type: EExchangeType.FANOUT,
    exchangeTag: '123',
  };
  expect(() => _fromJSON({})).toThrow(ExchangeInvalidDataError);
  const e = _fromJSON(json);
  expect(e.toJSON()).toEqual(json);
});
