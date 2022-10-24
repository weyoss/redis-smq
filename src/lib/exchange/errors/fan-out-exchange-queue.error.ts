import { ExchangeError } from './exchange.error';

export class FanOutExchangeQueueError extends ExchangeError {
  constructor() {
    super(
      'Binding different types of queues to the same exchange is not allowed.',
    );
  }
}
