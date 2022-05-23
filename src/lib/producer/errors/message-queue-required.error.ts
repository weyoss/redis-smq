import { RedisSMQError } from '../../../common/errors/redis-smq.error';

export class MessageQueueRequiredError extends RedisSMQError {
  constructor(msg = 'Can not publish a message without a message queue') {
    super(msg);
  }
}
