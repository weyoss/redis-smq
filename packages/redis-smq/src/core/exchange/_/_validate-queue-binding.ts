/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import {
  ExchangeNotFoundError,
  ExchangeQueuePolicyMismatchError,
  ExchangeTypeMismatchError,
} from '../../errors/index.js';
import { _getQueueProperties } from '../../queue-manager/_/_get-queue-properties.js';
import { _getExchangeProperties } from './_get-exchange-properties.js';
import {
  EExchangeQueuePolicy,
  EExchangeType,
  EQueueType,
  type IExchangeParsedParams,
  type IExchangeProperties,
  type IQueueParams,
  type IQueueProperties,
} from '../../../contracts/index.js';

/**
 * The result of validating that a queue can be bound to an exchange.
 *
 * Both properties are populated on success. The exchange is
 * guaranteed to exist — this validation is only reached for a bind
 * against an existing exchange.
 */
export interface IQueueBindingValidationResult {
  queueProperties: IQueueProperties;
  exchangeProperties: IExchangeProperties;
}

/**
 * Validate that a queue can be bound to an existing exchange.
 *
 * Checks:
 *
 *   1. The queue exists.
 *   2. The exchange exists.
 *   3. The exchange's stored type matches the caller's.
 *   4. The queue's type matches the exchange's queue policy.
 *
 * Any failure rejects. The caller (`_bindQueue`) relies on the
 * exchange being present: it does not create the exchange, and it
 * does not derive the queue policy from the queue's type. Lazy
 * creation was removed deliberately — see the file header of
 * `operations/bind-queue.ts` for the reasoning.
 */
export function _validateQueueBinding(
  client: IRedisClient,
  exchangeParams: IExchangeParsedParams,
  queueParams: IQueueParams,
  cb: ICallback<IQueueBindingValidationResult>,
): void {
  _getQueueProperties(client, queueParams, (queueErr, queueProperties) => {
    if (queueErr) return cb(queueErr);
    if (!queueProperties) return cb(new CallbackEmptyReplyError());

    _getExchangeProperties(
      client,
      exchangeParams,
      (exchangeErr, exchangeProperties) => {
        if (exchangeErr) return cb(exchangeErr);
        if (!exchangeProperties) return cb(new ExchangeNotFoundError());

        const typeErr = validateExchangeType(
          exchangeParams,
          exchangeProperties,
        );
        if (typeErr) return cb(typeErr);

        const policyErr = validateQueuePolicy(
          queueProperties,
          exchangeProperties,
        );
        if (policyErr) return cb(policyErr);

        cb(null, { queueProperties, exchangeProperties });
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * The exchange's stored type must match the caller's type.
 *
 * Returns `null` on success, an `ExchangeTypeMismatchError` on failure.
 */
function validateExchangeType(
  exchangeParams: IExchangeParsedParams,
  exchangeProperties: IExchangeProperties,
): Error | null {
  if (exchangeProperties.type === exchangeParams.type) return null;
  return new ExchangeTypeMismatchError({
    metadata: {
      expected: exchangeParams.type,
      actual: exchangeProperties.type,
    },
  });
}

/**
 * The queue's type must be allowed by the exchange's queue policy.
 *
 * STANDARD accepts FIFO and LIFO; PRIORITY accepts PRIORITY_QUEUE.
 * Returns `null` on success, an `ExchangeQueuePolicyMismatchError` on
 * failure.
 */
function validateQueuePolicy(
  queueProperties: IQueueProperties,
  exchangeProperties: IExchangeProperties,
): Error | null {
  const queueType = queueProperties.queueType;

  const isStandardCompatible =
    queueType === EQueueType.FIFO_QUEUE || queueType === EQueueType.LIFO_QUEUE;
  const isPriorityCompatible = queueType === EQueueType.PRIORITY_QUEUE;

  const policySatisfied =
    (exchangeProperties.queuePolicy === EExchangeQueuePolicy.STANDARD &&
      isStandardCompatible) ||
    (exchangeProperties.queuePolicy === EExchangeQueuePolicy.PRIORITY &&
      isPriorityCompatible);

  if (policySatisfied) return null;

  const expected =
    exchangeProperties.queuePolicy === EExchangeQueuePolicy.STANDARD
      ? `${EQueueType[EQueueType.FIFO_QUEUE]} or ${EQueueType[EQueueType.LIFO_QUEUE]}`
      : `${EQueueType[EQueueType.PRIORITY_QUEUE]}`;
  const actual = EQueueType[queueType];

  return new ExchangeQueuePolicyMismatchError({
    message:
      `Queue policy mismatch for ${EExchangeType[exchangeProperties.type]} ` +
      `exchange: expected ${expected} queue, but got ${actual}.`,
    metadata: {
      exchangeType: exchangeProperties.type,
      queuePolicy: exchangeProperties.queuePolicy,
      expected,
      actual,
    },
  });
}
