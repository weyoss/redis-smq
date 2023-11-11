import { promisifyAll } from 'bluebird';
import { ExchangeFanOut } from '../../src/lib/exchange/exchange-fan-out';
import {
  TExchangeDirectExchangeBindingParams,
  TExchangeFanOutExchangeBindingParams,
  TExchangeTopicExchangeBindingParams,
} from '../../types';
import { ExchangeTopic } from '../../src/lib/exchange/exchange-topic';
import { ExchangeDirect } from '../../src/lib/exchange/exchange-direct';

export function getFanOutExchange(
  bindingParams: TExchangeFanOutExchangeBindingParams,
) {
  return promisifyAll(new ExchangeFanOut(bindingParams));
}

export function getTopicExchange(
  bindingParams: TExchangeTopicExchangeBindingParams,
) {
  return promisifyAll(new ExchangeTopic(bindingParams));
}

export function getDirectExchange(
  bindingParams: TExchangeDirectExchangeBindingParams,
) {
  return promisifyAll(new ExchangeDirect(bindingParams));
}
