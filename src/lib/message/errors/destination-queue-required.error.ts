import { MessageError } from './message.error';

export class DestinationQueueRequiredError extends MessageError {
  constructor() {
    super(`Destination queue is required`);
  }
}
