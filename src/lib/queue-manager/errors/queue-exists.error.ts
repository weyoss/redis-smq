import { errors } from 'redis-smq-common';

export class QueueExistsError extends errors.RedisSMQError {}
