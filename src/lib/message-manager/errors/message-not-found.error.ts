import { errors } from 'redis-smq-common';

export class MessageNotFoundError extends errors.RedisSMQError {
  constructor() {
    super(
      `Message not found. Either message parameters are invalid or the message has been already deleted.`,
    );
  }
}
