/*
 * packages/redis-smq/src/core/errors/message-handler/invalid-message-handler-signature.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParsedParams } from '../../../contracts/index.js';

export class InvalidMessageHandlerSignatureError extends RedisSMQError<{
  queue: IQueueParsedParams;
}> {
  static override readonly code =
    'RedisSMQ.Consumer.InvalidMessageHandlerSignature';
  static override readonly defaultMessage =
    'Invalid message handler signature.';
}
