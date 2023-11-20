import { QueueError } from './queue.error';

export class QueueMessageRequeueError extends QueueError {
  constructor() {
    super(
      `Message can not be re-queued. Either the queue has been deleted or its settings does not allow to accept the message`,
    );
  }
}
