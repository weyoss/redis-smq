/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import {
  ExchangeNotFoundError,
  ExchangeTypeMismatchError,
} from '../../errors/index.js';
import { _getQueueProperties } from '../../queue-manager/_/_get-queue-properties.js';
import {
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../../queue-manager/index.js';
import {
  EExchangeQueuePolicy,
  EExchangeType,
  IExchangeParsedParams,
  IExchangeProperties,
} from '../types/index.js';
import { _getExchangeProperties } from './_get-exchange-properties.js';
import { ExchangeQueuePolicyMismatchError } from '../../errors/index.js';

export function _validateQueueBinding(
  client: IRedisClient,
  exchangeParams: IExchangeParsedParams,
  queueParams: IQueueParams,
  cb: ICallback<[IQueueProperties, IExchangeProperties | null]>,
) {
  async.series(
    [
      (cb1: ICallback<IQueueProperties>) =>
        _getQueueProperties(client, queueParams, cb1),
      (cb1: ICallback<IExchangeProperties | null>) => {
        _getExchangeProperties(client, exchangeParams, (err, reply) => {
          if (err instanceof ExchangeNotFoundError) return cb1(null, null);
          cb1(err, reply);
        });
      },
    ],
    (err, result) => {
      if (result) {
        const [queueProperties, exchangeProperties] = result;
        if (exchangeProperties) {
          // Validate existing exchange type (if present) is exchangeParams.type; refuse otherwise
          if (exchangeProperties.type !== exchangeParams.type) {
            return cb(
              new ExchangeTypeMismatchError({
                metadata: {
                  expected: exchangeParams.type,
                  actual: exchangeProperties.type,
                },
              }),
            );
          }

          // Validate queue policy
          const queueType = queueProperties.queueType;
          if (
            (exchangeProperties.queuePolicy === EExchangeQueuePolicy.STANDARD &&
              ![EQueueType.FIFO_QUEUE, EQueueType.LIFO_QUEUE].includes(
                queueType,
              )) ||
            (exchangeProperties.queuePolicy === EExchangeQueuePolicy.PRIORITY &&
              EQueueType.PRIORITY_QUEUE !== queueType)
          ) {
            // Build a precise error message with expected vs actual queue types
            const expected =
              exchangeProperties.queuePolicy === EExchangeQueuePolicy.STANDARD
                ? `${EQueueType[EQueueType.FIFO_QUEUE]} or ${EQueueType[EQueueType.LIFO_QUEUE]}`
                : `${EQueueType[EQueueType.PRIORITY_QUEUE]}`;
            const actual = EQueueType[queueType];

            return cb(
              new ExchangeQueuePolicyMismatchError({
                message: `Queue policy mismatch for ${
                  EExchangeType[exchangeProperties.type]
                } exchange: expected ${expected} queue, but got ${
                  EQueueType[queueType]
                }.`,
                metadata: {
                  exchangeType: exchangeProperties.type,
                  queuePolicy: exchangeProperties.queuePolicy,
                  expected: expected,
                  actual: actual,
                },
              }),
            );
          }
        }
      }
      cb(err, result);
    },
  );
}
