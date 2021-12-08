import { RedisSMQError } from './redis-smq.error';

export class EmptyCallbackReplyError extends RedisSMQError {
  constructor() {
    super(`Expected a non-empty reply`);
  }
}
