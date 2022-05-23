import { RedisSMQError } from '../../../common/errors/redis-smq.error';

export class MessageAlreadyPublishedError extends RedisSMQError {
  constructor(
    msg = 'Can not publish a message with a metadata instance. Either you have already published the message or you have called the getSetMetadata() method.',
  ) {
    super(msg);
  }
}
