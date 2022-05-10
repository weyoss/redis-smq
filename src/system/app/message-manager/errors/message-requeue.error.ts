import { RedisSMQError } from '../../../common/errors/redis-smq.error';

export class MessageRequeueError extends RedisSMQError {
  constructor() {
    super(
      `Message can not be re-queued. Either the queue has been deleted or its settings does not allow to accept the message`,
    );
  }
}
