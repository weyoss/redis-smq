import { ExchangeError } from './exchange.error';

export class DestinationQueueRequiredError extends ExchangeError {
  constructor() {
    super(`Destination queue is required`);
  }
}
