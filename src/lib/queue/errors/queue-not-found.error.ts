import { errors } from 'redis-smq-common';

export class QueueNotFoundError extends errors.RedisSMQError {
  constructor(msg = `Queue does not exist`) {
    super(msg);
  }
}
