import { errors } from 'redis-smq-common';

export class QueueRateLimitError extends errors.RedisSMQError {}
