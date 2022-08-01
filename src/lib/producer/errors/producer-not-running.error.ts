import { errors } from 'redis-smq-common';

export class ProducerNotRunningError extends errors.RedisSMQError {
  constructor(
    msg = `Producer instance is not running. Before producing messages you need to run your producer instance.`,
  ) {
    super(msg);
  }
}
