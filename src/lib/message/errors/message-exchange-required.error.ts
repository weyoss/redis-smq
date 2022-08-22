import { MessageError } from './message.error';

export class MessageExchangeRequiredError extends MessageError {
  constructor() {
    super(`A message exchange is required`);
  }
}
