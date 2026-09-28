/*
 * packages/redis-smq/src/core/errors/exchange/invalid-exchange-routing-key.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { IExchangeParams } from '../../../contracts/index.js';

export class InvalidExchangeRoutingKeyError extends RedisSMQError<{
  exchange: IExchangeParams;
  routingKey: string;
}> {
  static override readonly code = 'RedisSMQ.Exchange.InvalidRoutingKey';
  static override readonly defaultMessage = 'Invalid exchange routing key.';
}
