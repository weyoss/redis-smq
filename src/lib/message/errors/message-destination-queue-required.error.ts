import { MessageError } from './message.error';

export class MessageDestinationQueueRequiredError extends MessageError {
  constructor() {
    super(`Destination queue is required`);
  }
}
