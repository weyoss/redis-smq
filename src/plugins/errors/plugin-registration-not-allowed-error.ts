import { errors } from 'redis-smq-common';

export class PluginRegistrationNotAllowedError extends errors.RedisSMQError {
  constructor(
    msg = 'Plugin registration is only allowed before starting a consumer or a producer',
  ) {
    super(msg);
  }
}
