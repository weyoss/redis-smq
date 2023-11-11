import { MessageError } from './message.error';

export class DestinationQueueAlreadySetError extends MessageError {
  constructor() {
    super(`Destination queue is already set`);
  }
}
