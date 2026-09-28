/*
 * packages/redis-smq/src/core/exchange/_/_bind-queue.ts
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  IWatchTransactionAttemptResult,
  withWatchTransaction,
} from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import {
  InvalidExchangeParametersError,
  QueueAlreadyBoundError,
} from '../../errors/index.js';
import { _validateQueueBinding } from './_validate-queue-binding.js';
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
 * Bind a queue to an existing exchange.
 *
 * The exchange is required to exist. This function does not create
 * it, and it does not derive the exchange's queue policy from the
 * queue's type. Both of those were part of the previous lazy-
 * creation behavior and were removed because they let a `bindQueue`
 * call silently establish an exchange with a policy the caller
 * never stated. A caller who wants an exchange to exist calls
 * `create` first and states the policy explicitly.
 *
 * The strategy supplies the type-specific pieces:
 *
 *   - `bindingRequired` — whether a binding argument is required.
 *   - `validateBinding` — the type-specific binding validation.
 *   - `getBindingsListKey` — the exchange's set of bindings, or
 *     `null` for fanout.
 *   - `getBindingQueuesKey` — the queue set for a specific binding.
 *
 * `QueueAlreadyBoundError` is a successful outcome: the caller's intent
 * ("this queue is bound under this binding") is satisfied whether
 * the binding was created now or existed before.
 */
export function _bindQueue(
  client: IRedisClient,
  queueParams: IQueueParams,
  exchangeParams: IExchangeParsedParams,
  binding: string | null,
  logger: ILogger,
  cb: ICallback,
): void {
  const strategy = getStrategy(exchangeParams.type);

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

  const { keyExchanges } = keys.getMainKeys();
  const { keyNamespaceExchanges } = keys.getNamespaceKeys(queueParams.ns);
  const { keyExchange } = keys.getExchangeKeys(
    exchangeParams.ns,
    exchangeParams.name,
  );
  const { keyQueueProperties, keyQueueExchangeBindings } = keys.getQueueKeys(
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

  const watchKeys: string[] = [
    keyExchange,
    keyQueueProperties,
    bindingQueuesKey,
    keyQueueExchangeBindings,
    keyExchanges,
    keyNamespaceExchanges,
  ];
  if (bindingsListKey) watchKeys.push(bindingsListKey);

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
          EQueueOperation.BIND_EXCHANGE,
          next,
        ),

      (next: ICallback) =>
        withWatchTransaction(
          client,
          (c, watch, done) => {
            async.waterfall(
              [
                (w: ICallback<void>) => watch(watchKeys, w),

                (_: void, w: ICallback<void>) =>
                  _validateQueueBinding(
                    c,
                    exchangeParams,
                    queueParams,
                    (err, reply) => {
                      if (err) return w(err);
                      if (!reply) return w(new CallbackEmptyReplyError());
                      w();
                    },
                  ),

                (_: void, w: ICallback<void>) =>
                  c.sismember(bindingQueuesKey, queueStr, (err, reply) => {
                    if (err) return w(err);
                    if (reply === 1) return w(new QueueAlreadyBoundError());
                    w();
                  }),

                (_: void, w: ICallback<IWatchTransactionAttemptResult>) => {
                  const multi = c.multi();

                  // The exchange's hash is not written here — it was
                  // written by `create`, and `_validateQueueBinding`
                  // already confirmed the stored type and policy match
                  // the caller's request. The `SADD` to the exchange
                  // indexes is a no-op if the exchange is already
                  // registered there, which `create` guarantees.
                  multi.sadd(keyExchanges, exchangeStr);
                  multi.sadd(keyNamespaceExchanges, exchangeStr);
                  if (bindingsListKey && binding != null) {
                    multi.sadd(bindingsListKey, binding);
                  }
                  multi.sadd(bindingQueuesKey, queueStr);
                  multi.sadd(keyQueueExchangeBindings, exchangeStr);

                  w(null, { multi });
                },
              ],
              done,
            );
          },
          (err) => {
            if (err instanceof QueueAlreadyBoundError) return next();
            if (err) return next(err);
            logger.info(
              `bindQueue: bound queue=${queueParams.name}@${queueParams.ns} -> ex=${exchangeParams.name}@${exchangeParams.ns}${bindingLabel}`,
            );
            next();
          },
          {
            maxAttempts: 5,
            onRetry: (attemptNo, maxAttempts) =>
              logger.warn(
                `bindQueue: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
              ),
          },
        ),
    ],
    (err) => cb(err),
  );
}
