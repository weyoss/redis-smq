import { EExchangeType, TExchangeSerialized } from '../../../../types';
import { InvalidExchangeDataError } from '../../../../src/lib/exchange/errors/invalid-exchange-data.error';
import { _fromJSON } from '../../../../src/lib/exchange/_from-json';

test('ExchangeTopic: fromJSON()', async () => {
  const json: TExchangeSerialized = {
    bindingParams: 'w123.1',
    type: EExchangeType.TOPIC,
    exchangeTag: '123',
  };
  expect(() => _fromJSON({})).toThrow(InvalidExchangeDataError);
  const e = _fromJSON(json);
  expect(e.toJSON()).toEqual({
    bindingParams: {
      ns: 'testing',
      topic: 'w123.1',
    },
    type: EExchangeType.TOPIC,
    exchangeTag: '123',
  });
});
