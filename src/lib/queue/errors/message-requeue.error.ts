import { errors } from 'redis-smq-common';

export class MessageRequeueError extends errors.RedisSMQError {
  constructor() {
    super(
      `Message can not be re-queued. Either the queue has been deleted or its settings does not allow to accept the message`,
    );
  }
}
