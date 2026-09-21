/*
 * packages/redis-smq/src/core/exchange/_/_delete-exchange.ts
 */

import {
  async,
  ICallback,
  ILogger,
  IRedisClient,
  IWatchTransactionAttemptResult,
  withWatchTransaction,
} from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import { ExchangeHasBoundQueuesError } from '../../errors/index.js';
import { _validateExchange } from './_validate-exchange.js';
import { _stringifyExchangeParams } from './_stringify-exchange-params.js';
import { getStrategy } from '../strategies/registry.js';
import {
  EExchangeType,
  type IExchangeParsedParams,
} from '../../../contracts/index.js';

/**
 * Delete an exchange.
 *
 * The manager is the only intended caller. It has already:
 *
 *   - Parsed `exchange` into `IExchangeParsedParams`, resolving the
 *     namespace and the type.
 *
 * Errors raised by this function:
 *
 *   - `ExchangeNotFoundError` — the exchange does not exist. Delete is
 *     not idempotent in return value; a caller who wants "ensure the
 *     exchange is gone" catches this class and treats it as success.
 *
 *   - `ExchangeTypeMismatchError` — the exchange exists but its stored
 *     type disagrees with the type resolved from the caller's request.
 *     Raised by `_validateExchange`.
 *
 *   - `ExchangeHasBoundQueuesError` — at least one queue is still
 *     bound. The caller must unbind every queue before retrying.
 *
 * @param client - A pooled Redis client. The caller owns its
 *   lifecycle; this function does not acquire or release it.
 * @param exchangeParams - The parsed exchange, including its type.
 *   The type drives the strategy lookup.
 * @param logger - The manager's logger, used for the debug/abort/success
 *   lines and for the retry warnings.
 * @param cb - The transaction callback. Called with no argument on
 *   success, or with the error on failure.
 */
export function _deleteExchange(
  client: IRedisClient,
  exchangeParams: IExchangeParsedParams,
  logger: ILogger,
  cb: ICallback,
): void {
  const strategy = getStrategy(exchangeParams.type);

  // -------------------------------------------------------------------------
  // Key derivation. The two strategy-supplied keys plus the two
  // registry-index keys and the exchange hash key.
  // -------------------------------------------------------------------------

  const { keyExchanges } = keys.getMainKeys();
  const { keyNamespaceExchanges } = keys.getNamespaceKeys(exchangeParams.ns);
  const { keyExchange } = keys.getExchangeKeys(
    exchangeParams.ns,
    exchangeParams.name,
  );

  // The bindings list: `keyExchangeRoutingKeys` for direct,
  // `keyExchangeBindingPatterns` for topic, `null` for fanout.
  const bindingsListKey = strategy.getBindingsListKey(
    exchangeParams.ns,
    exchangeParams.name,
  );

  // For fanout, this is the exchange's single queue set. For direct
  // and topic, the correct key depends on a binding — which the
  // operation discovers at runtime — so this initial derivation is
  // only used in the fanout branch below.
  const fanoutQueueKey = strategy.getBindingQueuesKey(
    exchangeParams.ns,
    exchangeParams.name,
  );

  const exchangeStr = _stringifyExchangeParams(exchangeParams);

  // The WATCH list assembled before entering the transaction. Direct
  // and topic watch the bindings list (they will read it during the
  // transaction to derive per-binding keys, which are watched in a
  // second pass). Fanout watches its single queue-set key directly.
  const initialWatchKeys: string[] = [
    keyExchange,
    keyExchanges,
    keyNamespaceExchanges,
  ];
  if (bindingsListKey) {
    initialWatchKeys.push(bindingsListKey);
  } else {
    initialWatchKeys.push(fanoutQueueKey);
  }

  logger.debug(
    `delete: exchange=${exchangeParams.name}@${exchangeParams.ns} ` +
      `type=${EExchangeType[exchangeParams.type]}`,
  );

  withWatchTransaction(
    client,
    (c, watch, done) => {
      // The set of queue-set keys discovered during the transaction.
      // Populated in step 3, watched in step 4, checked in step 5,
      // and deleted in step 6. An empty array (a direct or topic
      // exchange with no bindings) is valid and passes the
      // precondition trivially.
      let queueSetKeys: string[] = [];

      async.waterfall(
        [
          // -----------------------------------------------------------------
          // 1) WATCH the initial keys.
          // -----------------------------------------------------------------
          (w: ICallback<void>) => watch(initialWatchKeys, w),

          // -----------------------------------------------------------------
          // 2) Validate existence and type. A missing exchange is an
          //    error here (delete is not idempotent); a stored type
          //    that disagrees with the caller's is a caller error
          //    signalled by `_validateExchange`.
          // -----------------------------------------------------------------
          (_: void, w: ICallback<void>) =>
            _validateExchange(c, exchangeParams, true, w),

          // -----------------------------------------------------------------
          // 3) Enumerate the queue-set keys.
          //
          //    Direct/topic: read the exchange's bindings list, then
          //    derive a queue-set key for each binding. A binding
          //    entry that is not a non-empty string is filtered out
          //    defensively — the framework never writes such entries,
          //    but a corrupted registry should not crash the delete.
          //
          //    Fanout: the queue-set key was computed before the
          //    transaction (`fanoutQueueKey`); it is the entire
          //    enumeration.
          // -----------------------------------------------------------------
          (_: void, w: ICallback<void>) => {
            if (!bindingsListKey) {
              queueSetKeys = [fanoutQueueKey];
              return w();
            }
            c.smembers(bindingsListKey, (err, bindings) => {
              if (err) return w(err);
              const list = (bindings ?? []).filter(
                (b): b is string => typeof b === 'string' && b.length > 0,
              );
              queueSetKeys = list.map((b) =>
                strategy.getBindingQueuesKey(
                  exchangeParams.ns,
                  exchangeParams.name,
                  b,
                ),
              );
              w();
            });
          },

          // -----------------------------------------------------------------
          // 4) WATCH the per-binding queue-set keys that step 3
          //    discovered. For fanout the key is already in the
          //    initial watch list, so this step is a no-op. For
          //    direct/topic with no bindings, there is nothing to
          //    watch.
          // -----------------------------------------------------------------
          (_: void, w: ICallback<void>) => {
            if (!bindingsListKey || queueSetKeys.length === 0) return w();
            watch(queueSetKeys, w);
          },

          // -----------------------------------------------------------------
          // 5) Precondition: every queue set must be empty.
          //
          //    The bindings list's invariant is that it only holds
          //    bindings with at least one bound queue, and a
          //    well-behaved `unbindQueue` removes a binding from the
          //    list when its queue set becomes empty. The check is
          //    therefore expected to always pass on a healthy
          //    exchange — but it is not a tautology. A corrupted
          //    bindings list, a race with a `bindQueue` that landed
          //    between step 3's read and step 5's check, or a future
          //    bug that leaves a stale binding entry would all be
          //    caught here rather than silently deleting the queue
          //    sets those bindings reference.
          // -----------------------------------------------------------------
          (_: void, w: ICallback<void>) => {
            if (queueSetKeys.length === 0) return w();

            let hasBoundQueues = false;
            async.eachOf(
              queueSetKeys,
              (k, _i, next) => {
                c.scard(k, (err, count) => {
                  if (err) return next(err);
                  if ((count ?? 0) > 0) hasBoundQueues = true;
                  next();
                });
              },
              (err) => {
                if (err) return w(err);
                if (hasBoundQueues) {
                  logger.warn(
                    `delete: exchange has bound queues, aborting ` +
                      `exchange=${exchangeParams.name}@${exchangeParams.ns}`,
                  );
                  return w(new ExchangeHasBoundQueuesError());
                }
                w();
              },
            );
          },

          // -----------------------------------------------------------------
          // 6) Build the MULTI.
          //
          //    - `DEL keyExchange` removes the exchange hash.
          //    - `DEL bindingsListKey` removes the bindings list
          //      (direct/topic only; null for fanout).
          //    - `DEL` every queue-set key removes each binding's
          //      queues set. A `DEL` on a key that does not exist is
          //      a no-op, so this step is safe even if a queue set
          //      was never written.
          //    - `SREM` on the two registry-index sets removes the
          //      exchange from `getAllExchanges` and
          //      `getNamespaceExchanges` respectively.
          // -----------------------------------------------------------------
          (_: void, w: ICallback<IWatchTransactionAttemptResult>) => {
            const multi = c.multi();
            multi.del(keyExchange);
            if (bindingsListKey) multi.del(bindingsListKey);
            for (const k of queueSetKeys) multi.del(k);
            multi.srem(keyExchanges, exchangeStr);
            multi.srem(keyNamespaceExchanges, exchangeStr);
            w(null, { multi });
          },
        ],
        done,
      );
    },
    (err) => {
      if (err) return cb(err);
      logger.info(
        `delete: deleted exchange=${exchangeParams.name}@${exchangeParams.ns}`,
      );
      cb();
    },
    {
      maxAttempts: 5,
      onRetry: (attemptNo, maxAttempts) =>
        logger.warn(
          `delete: concurrent modification, retrying ` +
            `attempt=${attemptNo}/${maxAttempts}`,
        ),
    },
  );
}
