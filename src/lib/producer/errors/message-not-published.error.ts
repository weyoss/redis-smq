import { errors } from 'redis-smq-common';

export class MessageNotPublishedError extends errors.RedisSMQError {}
