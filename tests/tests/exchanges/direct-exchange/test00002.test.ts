import { EExchangeType, IDirectExchangeParams } from '../../../../types';
import { InvalidExchangeDataError } from '../../../../src/lib/exchange/errors/invalid-exchange-data.error';
import { DirectExchange } from '../../../../src/lib/exchange/direct-exchange';

test('DirectExchange: fromJSON()', async () => {
  const json: IDirectExchangeParams = {
    bindingParams: 'w123.1',
    type: EExchangeType.DIRECT,
    destinationQueue: null,
    exchangeTag: '123',
  };
  expect(() => DirectExchange.fromJSON({})).toThrow(InvalidExchangeDataError);
  const e = DirectExchange.fromJSON(json);
  expect(e.toJSON()).toEqual(json);
});
