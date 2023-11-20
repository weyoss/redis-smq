import { EExchangeType, TExchangeSerialized } from '../../../../types';
import { ExchangeInvalidDataError } from '../../../../src/lib/exchange/errors';
import { _fromJSON } from '../../../../src/lib/exchange/_from-json';

test('ExchangeDirect: fromJSON()', async () => {
  const json: TExchangeSerialized = {
    bindingParams: 'w123.1',
    type: EExchangeType.DIRECT,
    exchangeTag: '123',
  };
  expect(() => _fromJSON({})).toThrow(ExchangeInvalidDataError);
  const e = _fromJSON(json);
  expect(e.toJSON()).toEqual({
    bindingParams: {
      ns: 'testing',
      name: 'w123.1',
    },
    type: EExchangeType.DIRECT,
    exchangeTag: '123',
  });
});
