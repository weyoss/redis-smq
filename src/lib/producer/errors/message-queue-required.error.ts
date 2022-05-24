import { errors } from 'redis-smq-common';

export class MessageQueueRequiredError extends errors.RedisSMQError {
  constructor(msg = 'Can not publish a message without a message queue') {
    super(msg);
  }
}
