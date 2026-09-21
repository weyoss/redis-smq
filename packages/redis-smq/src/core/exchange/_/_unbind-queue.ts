/*
 * packages/redis-smq/src/core/exchange/_/_unbind-queue.ts
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
import {
  InvalidExchangeParametersError,
  QueueNotBoundError,
} from '../../errors/index.js';
import { _validateExchange } from './_validate-exchange.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { _stringifyQueueParams } from '../../queue-manager/_/_stringify-queue-params.js';
import { _stringifyExchangeParams } from './_stringify-exchange-params.js';
import { getStrategy } from '../strategies/registry.js';
import {
  EExchangeType,
  EQueueOperation,
  type IExchangeParsedParams,
  type IQueueParams,
} from '../../../contracts/index.js';

/**
 * Unbind a queue from an exchange.
 *
 * Shared across all three exchange types. The strategy supplies the
 * two type-specific facts the transaction needs:
 *
 *   - `getBindingsListKey` — the exchange's set of bindings. `null`
 *     for fanout, which has no such list.
 *   - `getBindingQueuesKey` — the queue set for a specific binding.
 *     For fanout the binding argument is ignored.
 *
 * The two shapes differ in exactly two places: whether the exchange's
 * bindings list must be updated when the queue is removed (list-backed
 * only), and whether the queue's exchange-bindings index should drop
 * the exchange (conditional for list-backed, unconditional for
 * fanout).
 *
 * `QueueNotBoundError` is not idempotent in return value — unbinding a
 * queue that is not bound under the given binding fails. `bindQueue`'s
 * symmetric case ("already bound") is a silent no-op; the asymmetry is
 * deliberate.
 */
export function _unbindQueue(
  client: IRedisClient,
  queueParams: IQueueParams,
  exchangeParams: IExchangeParsedParams,
  binding: string | null,
  logger: ILogger,
  cb: ICallback,
): void {
  const strategy = getStrategy(exchangeParams.type);

  // Arity and content checks before touching Redis.
  if (strategy.bindingRequired && binding == null) {
    return cb(new InvalidExchangeParametersError());
  }
  if (!strategy.bindingRequired && binding != null) {
    return cb(new InvalidExchangeParametersError());
  }
  if (binding != null) {
    const validated = strategy.validateBinding(binding);
    if (validated instanceof Error) return cb(validated);
    binding = validated;
  }

  const { keyExchange } = keys.getExchangeKeys(
    exchangeParams.ns,
    exchangeParams.name,
  );
  const { keyQueueExchangeBindings } = keys.getQueueKeys(
    queueParams.ns,
    queueParams.name,
    null,
  );
  const bindingsListKey = strategy.getBindingsListKey(
    exchangeParams.ns,
    exchangeParams.name,
  );
  const bindingQueuesKey = strategy.getBindingQueuesKey(
    exchangeParams.ns,
    exchangeParams.name,
    binding ?? undefined,
  );

  const queueStr = _stringifyQueueParams(queueParams);
  const exchangeStr = _stringifyExchangeParams(exchangeParams);

  const baseWatchKeys: string[] = [keyExchange, bindingQueuesKey];
  if (bindingsListKey) baseWatchKeys.push(bindingsListKey);
  baseWatchKeys.push(keyQueueExchangeBindings);

  // Preserve the source's per-type binding label in log lines. The
  // direct exchange calls its binding a routing key (`rk=`), the topic
  // exchange calls it a pattern (`pat=`), and fanout has neither.
  const bindingLabel =
    binding == null
      ? ''
      : exchangeParams.type === EExchangeType.DIRECT
        ? ` rk=${binding}`
        : ` pat=${binding}`;

  async.series(
    [
      (next: ICallback) =>
        _validateOperation(
          client,
          queueParams,
          EQueueOperation.UNBIND_EXCHANGE,
          next,
        ),

      (next: ICallback) =>
        withWatchTransaction(
          client,
          (c, watch, done) => {
            let allBindings: string[] = [];
            let currentBindingCount = 0;
            let stillBoundViaOtherBinding = false;

            async.waterfall(
              [
                (w: ICallback<void>) => watch(baseWatchKeys, w),

                (_: void, w: ICallback<void>) =>
                  _validateExchange(c, exchangeParams, true, w),

                (_: void, w: ICallback<void>) =>
                  c.sismember(bindingQueuesKey, queueStr, (err, reply) => {
                    if (err) return w(err);
                    if (reply !== 1) return w(new QueueNotBoundError());
                    w();
                  }),

                (_: void, w: ICallback<void>) => {
                  if (!bindingsListKey) return w();
                  c.smembers(bindingsListKey, (err, bindings) => {
                    if (err) return w(err);
                    allBindings = (bindings ?? []).filter(
                      (b) => typeof b === 'string' && b.length > 0,
                    );
                    w();
                  });
                },

                (_: void, w: ICallback<void>) => {
                  if (!bindingsListKey) return w();
                  const otherKeys = allBindings
                    .filter((b) => b !== binding)
                    .map((b) =>
                      strategy.getBindingQueuesKey(
                        exchangeParams.ns,
                        exchangeParams.name,
                        b,
                      ),
                    );
                  if (otherKeys.length === 0) return w();
                  watch(otherKeys, w);
                },

                (_: void, w: ICallback<void>) => {
                  if (!bindingsListKey) return w();
                  const otherBindings = allBindings.filter(
                    (b) => b !== binding,
                  );
                  async.series(
                    [
                      (x: ICallback<void>) =>
                        c.scard(bindingQueuesKey, (err, count) => {
                          if (err) return x(err);
                          currentBindingCount = count ?? 0;
                          x();
                        }),
                      (x: ICallback<void>) => {
                        if (otherBindings.length === 0) return x();
                        async.eachOf(
                          otherBindings,
                          (otherBinding, _i, next) => {
                            if (stillBoundViaOtherBinding) return next();
                            const otherKey = strategy.getBindingQueuesKey(
                              exchangeParams.ns,
                              exchangeParams.name,
                              otherBinding,
                            );
                            c.sismember(otherKey, queueStr, (err, reply) => {
                              if (err) return next(err);
                              if (reply === 1) stillBoundViaOtherBinding = true;
                              next();
                            });
                          },
                          (err) => x(err || null),
                        );
                      },
                    ],
                    (err) => w(err),
                  );
                },

                (_: void, w: ICallback<IWatchTransactionAttemptResult>) => {
                  const multi = c.multi();
                  multi.srem(bindingQueuesKey, queueStr);

                  if (bindingsListKey && binding != null) {
                    if (currentBindingCount === 1) {
                      multi.srem(bindingsListKey, binding);
                    }
                    if (!stillBoundViaOtherBinding) {
                      multi.srem(keyQueueExchangeBindings, exchangeStr);
                    }
                  } else {
                    multi.srem(keyQueueExchangeBindings, exchangeStr);
                  }

                  w(null, { multi });
                },
              ],
              done,
            );
          },
          (err) => {
            if (err) return next(err);
            logger.info(
              `unbindQueue: unbound queue=${queueParams.name}@${queueParams.ns} from ex=${exchangeParams.name}@${exchangeParams.ns}${bindingLabel}`,
            );
            next();
          },
          {
            maxAttempts: 5,
            onRetry: (attemptNo, maxAttempts) =>
              logger.warn(
                `unbindQueue: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
              ),
          },
        ),
    ],
    (err) => cb(err),
  );
}
