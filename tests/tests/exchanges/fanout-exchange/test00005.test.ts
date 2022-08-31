import { EExchangeType, IFanOutExchangeParams } from '../../../../types';
import { InvalidExchangeDataError } from '../../../../src/lib/exchange/errors/invalid-exchange-data.error';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out.exchange';

test('FanOutExchange: fromJSON()', async () => {
  const json: IFanOutExchangeParams = {
    bindingParams: 'w123.1',
    type: EExchangeType.FANOUT,
    destinationQueue: null,
    exchangeTag: '123',
  };
  expect(() => FanOutExchange.fromJSON({})).toThrow(InvalidExchangeDataError);
  const e = FanOutExchange.fromJSON(json);
  expect(e.toJSON()).toEqual(json);
});
