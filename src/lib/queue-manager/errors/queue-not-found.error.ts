import { RedisSMQError } from '../../../common/errors/redis-smq.error';

export class QueueNotFoundError extends RedisSMQError {
  constructor(msg = `Queue does not exist`) {
    super(msg);
  }
}
