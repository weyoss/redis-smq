/*
 * packages/redis-smq/src/core/errors/exchange/exchange-type-mismatch.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { EExchangeType } from '../../../contracts/index.js';

/**
 * Indicates that an operation was attempted on an exchange but the provided
 * exchange type does not match the existing exchange's type.
 */
export class ExchangeTypeMismatchError extends RedisSMQError<{
  expected: EExchangeType;
  actual: EExchangeType;
}> {
  static override readonly code = 'RedisSMQ.Exchange.TypeMismatch';
  static override readonly defaultMessage = 'Exchange type mismatch.';
}
