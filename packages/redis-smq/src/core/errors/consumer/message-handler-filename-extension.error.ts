/*
 * packages/redis-smq/src/core/errors/message-handler/message-handler-filename-extension.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';

export class MessageHandlerFilenameExtensionError extends RedisSMQError {
  static override readonly code =
    'RedisSMQ.Consumer.MessageHandlerFilenameExtension';
  static override readonly defaultMessage =
    'Invalid message handler filename extension.';
}
