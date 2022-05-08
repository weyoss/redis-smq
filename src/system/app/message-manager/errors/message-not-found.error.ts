import { RedisSMQError } from '../../../common/errors/redis-smq.error';

export class MessageNotFoundError extends RedisSMQError {
  constructor() {
    super(
      `Message not found. Either message parameters are invalid or the message has been already deleted.`,
    );
  }
}
