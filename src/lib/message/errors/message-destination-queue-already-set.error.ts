import { MessageError } from './message.error';

export class MessageDestinationQueueAlreadySetError extends MessageError {
  constructor() {
    super(`Destination queue is already set`);
  }
}
