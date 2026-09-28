/*
 * packages/redis-smq/src/core/errors/exchange/invalid-topic-exchange-params.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';

export class InvalidTopicExchangeParamsError extends RedisSMQError {
  static override readonly code =
    'RedisSMQ.Exchange.InvalidTopicExchangeParameters';
  static override readonly defaultMessage =
    'Invalid topic exchange parameters.';
}
