import { errors } from 'redis-smq-common';

export class MessageAlreadyPublishedError extends errors.RedisSMQError {
  constructor(
    msg = 'The message can not published. Either you have already published the message or you have called the getSetMessageState() method.',
  ) {
    super(msg);
  }
}
