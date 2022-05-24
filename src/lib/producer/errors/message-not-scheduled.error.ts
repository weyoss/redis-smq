import { errors } from 'redis-smq-common';

export class MessageNotScheduledError extends errors.RedisSMQError {}
