import { RedisSMQError } from '../../common/errors/redis-smq.error';

export class MessageNotFoundError extends RedisSMQError {
  constructor(
    messageId: string,
    queueName: string,
    namespace: string,
    sequenceId = -1,
  ) {
    super(
      `Message (${messageId})${
        sequenceId >= 0 ? ` with sequenceId (${sequenceId})` : ''
      } does not exist in (${queueName}@${namespace}) queue. Either message parameters are invalid or the message has been already deleted.`,
    );
  }
}
