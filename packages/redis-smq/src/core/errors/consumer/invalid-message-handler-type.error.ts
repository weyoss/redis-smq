/*
 * packages/redis-smq/src/core/errors/message-handler/invalid-message-handler-type.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IQueueParsedParams } from '../../../contracts/index.js';

export class InvalidMessageHandlerTypeError extends RedisSMQError<{
  queue: IQueueParsedParams;
}> {
  static override readonly code = 'RedisSMQ.Consumer.InvalidMessageHandlerType';
  static override readonly defaultMessage = 'Invalid message handler type.';
}
