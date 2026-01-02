/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  IRedisClient,
  IWatchTransactionAttemptResult,
  withWatchTransaction,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  EExchangeProperty,
  EExchangeQueuePolicy,
  IExchangeParsedParams,
} from '../types/index.js';
import { ExchangeAlreadyExistsError } from '../../errors/exchange-already-exists.error.js';

export function _saveExchange(
  client: IRedisClient,
  exchangeParams: IExchangeParsedParams,
  exchangeQueuePolicy: EExchangeQueuePolicy,
  cb: ICallback,
) {
  const { keyExchanges } = redisKeys.getMainKeys();
  const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
    exchangeParams.ns,
  );
  const { keyExchange } = redisKeys.getExchangeKeys(
    exchangeParams.ns,
    exchangeParams.name,
  );

  withWatchTransaction(
    client,
    (client, watch, done) => {
      async.waterfall(
        [
          // 1) WATCH base keys BEFORE any reads that inform writes
          (cb1: ICallback<void>) =>
            watch([keyExchange, keyExchanges, keyNamespaceExchanges], cb1),

          // 2) Check if the exchange already exists
          (_: void, cb1: ICallback<void>) =>
            client.hget(
              keyExchange,
              String(EExchangeProperty.TYPE),
              (err, reply) => {
                if (err) return cb1(err);
                if (reply) return cb1(new ExchangeAlreadyExistsError());
                cb1();
              },
            ),

          // 3) Build MULTI to persist meta
          (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
            const typeField = String(EExchangeProperty.TYPE);
            const queuePolicyField = String(EExchangeProperty.QUEUE_POLICY);
            const exchangeStr = JSON.stringify(exchangeParams);

            const multi = client.multi();

            multi.hset(keyExchange, typeField, exchangeParams.type);
            multi.hset(
              keyExchange,
              queuePolicyField,
              Number(exchangeQueuePolicy),
            );

            // Register exchange in global and namespace indexes
            multi.sadd(keyExchanges, exchangeStr);
            multi.sadd(keyNamespaceExchanges, exchangeStr);

            cb1(null, { multi });
          },
        ],
        done,
      );
    },
    (err) => cb(err),
  );
}
