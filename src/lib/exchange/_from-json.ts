import { EExchangeType, TExchangeSerialized } from '../../../types';
import { InvalidExchangeDataError } from './errors/invalid-exchange-data.error';
import { ExchangeFanOut } from './exchange-fan-out';
import { ExchangeTopic } from './exchange-topic';
import { ExchangeDirect } from './exchange-direct';

export function _fromJSON(
  json: TExchangeSerialized,
): ExchangeFanOut | ExchangeTopic | ExchangeDirect {
  if (!json.bindingParams || json.type === undefined)
    throw new InvalidExchangeDataError();
  if (json.type === EExchangeType.FANOUT) {
    const e = new ExchangeFanOut(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
  if (json.type === EExchangeType.TOPIC) {
    const e = new ExchangeTopic(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
  if (json.type === EExchangeType.DIRECT) {
    const e = new ExchangeDirect(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
  throw new InvalidExchangeDataError();
}
