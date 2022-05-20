import { RedisSMQError } from './redis-smq.error';

export class InvalidCallbackReplyError extends RedisSMQError {
  constructor() {
    super(`Invalid reply type`);
  }
}
