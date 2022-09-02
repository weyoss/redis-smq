import { TopicExchange } from '../../../../src/lib/exchange/topic-exchange';
import { EExchangeType, ITopicExchangeParams } from '../../../../types';
import { InvalidExchangeDataError } from '../../../../src/lib/exchange/errors/invalid-exchange-data.error';

test('TopicExchange: fromJSON()', async () => {
  const json: ITopicExchangeParams = {
    bindingParams: 'w123.1',
    type: EExchangeType.TOPIC,
    destinationQueue: null,
    exchangeTag: '123',
  };
  expect(() => TopicExchange.fromJSON({})).toThrow(InvalidExchangeDataError);
  const e = TopicExchange.fromJSON(json);
  expect(e.toJSON()).toEqual(json);
});
