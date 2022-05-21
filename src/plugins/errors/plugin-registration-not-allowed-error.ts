import { RedisSMQError } from '../../common/errors/redis-smq.error';

export class PluginRegistrationNotAllowedError extends RedisSMQError {
  constructor(
    msg = 'Plugin registration is only allowed before starting a consumer or a producer',
  ) {
    super(msg);
  }
}
