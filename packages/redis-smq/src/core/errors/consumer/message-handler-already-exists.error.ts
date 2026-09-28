/*
 * packages/redis-smq/src/core/errors/message-handler/message-handler-already-exists.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';

export class MessageHandlerAlreadyExistsError extends RedisSMQError {
  static override readonly code =
    'RedisSMQ.Consumer.MessageHandlerAlreadyExists';
  static override readonly defaultMessage =
    'A message handler for this queue already exists.';
}
