/*
 * packages/redis-smq/src/core/errors/message-handler/message-handler-file.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';

export class MessageHandlerFileError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Consumer.MessageHandlerFileError';
  static override readonly defaultMessage = 'Message handler file error.';
}
