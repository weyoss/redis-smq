import { errors } from 'redis-smq-common';

export class QueueNotEmptyError extends errors.RedisSMQError {
  constructor() {
    super(`Queue not empty.`);
  }
}
