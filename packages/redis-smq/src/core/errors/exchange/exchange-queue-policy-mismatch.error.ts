/*
 * packages/redis-smq/src/core/errors/exchange/exchange-queue-policy-mismatch.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import {
  EExchangeQueuePolicy,
  EExchangeType,
} from '../../../contracts/index.js';

/**
 * Indicates that a queue could not be bound to an exchange because the queue's
 * type is incompatible with the exchange's queue policy.
 */
export class ExchangeQueuePolicyMismatchError extends RedisSMQError<{
  exchangeType: EExchangeType;
  queuePolicy: EExchangeQueuePolicy;
  expected: string;
  actual: string;
}> {
  static override readonly code = 'RedisSMQ.Exchange.QueuePolicyMismatch';
  static override readonly defaultMessage =
    "The queue's type is not compatible with the exchange's queue policy.";
}
