import { ExchangeError } from './exchange.error';

export class InvalidExchangeDataError extends ExchangeError {
  constructor() {
    super('Invalid exchange data');
  }
}
