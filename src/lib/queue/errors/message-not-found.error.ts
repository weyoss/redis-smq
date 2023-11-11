import { errors } from 'redis-smq-common';

export class MessageNotFoundError extends errors.RedisSMQError {
  constructor() {
    super(`Message not found`);
  }
}
