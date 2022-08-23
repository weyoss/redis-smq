import { ExchangeError } from './exchange.error';

export class InvalidTopicError extends ExchangeError {
  constructor() {
    super(
      `Invalid topic. Topic name must be a combination of alphanumeric characters (a-zA-Z0-9), a dash (-), and a dot (.)`,
    );
  }
}
