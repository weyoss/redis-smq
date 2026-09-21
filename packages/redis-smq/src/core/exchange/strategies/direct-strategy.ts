/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import { validateRedisKey } from '../../common/redis/keys/validator.js';
import {
  InvalidDirectExchangeParametersError,
  InvalidExchangeRoutingKeyError,
} from '../../errors/index.js';
import { _validateExchange } from '../_/_validate-exchange.js';
import { _getRoutingKeyBoundQueues } from '../_/_get-routing-key-bound-queues.js';
import {
  EExchangeType,
  type IExchangeParsedParams,
  type IExchangeStrategy,
  type IQueueParams,
} from '../../../contracts/index.js';

/**
 * Direct exchange strategy.
 *
 * A direct exchange routes by exact routing key match: a message
 * published under routing key `k` reaches every queue bound under the
 * same key `k`, and no others. There is no pattern matching, no
 * wildcards, and no fan-out.
 *
 * THE SIMPLEST STRATEGY OF THE THREE:
 *
 *   Direct's `matchQueues` is a single `SMEMBERS` against the queue
 *   set whose key is derived from the routing key. Topic reads a
 *   pattern set, filters by match, and unions per-pattern queue sets;
 *   fanout reads the exchange's single queue set and ignores the
 *   routing key. Direct is the one strategy whose match is one Redis
 *   round-trip, and it is the only strategy whose binding and
 *   routing-key concepts coincide exactly — in a direct exchange, the
 *   binding *is* the routing key.
 */

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

export class DirectStrategy implements IExchangeStrategy {
  /**
   * Direct exchanges are identified by `EExchangeType.DIRECT` in both
   * the properties hash and the persisted routing model. See
   * `EExchangeType` for the persistence contract.
   */
  readonly type = EExchangeType.DIRECT;

  /**
   * A direct exchange binding always carries a routing key. The
   * manager's arity check uses this to reject a `bindQueue` or
   * `unbindQueue` call that omits the routing key before any Redis
   * round-trip.
   */
  readonly bindingRequired = true;

  // -------------------------------------------------------------------------
  // Binding validation
  // -------------------------------------------------------------------------

  /**
   * Validate a routing key for a direct exchange.
   *
   * A routing key is a Redis-key-shaped identifier: letters, digits,
   * hyphens, underscores, and dots, starting with a letter. The
   * validator lowercases on the way out, and the caller is expected to
   * use the returned value for any subsequent key derivation — see the
   * file header for why.
   *
   * Returns `string` on success, `InvalidDirectExchangeParametersError`
   * on failure. The error class is the one the source implementation
   * raises for a malformed routing key in a bind or unbind context;
   * the match context uses a different class, and that validation
   * happens inside `matchQueues` rather than here.
   */
  validateBinding(binding: string): Error | string {
    const validated = validateRedisKey(binding);
    if (validated instanceof Error) {
      return new InvalidDirectExchangeParametersError();
    }
    return validated;
  }

  // -------------------------------------------------------------------------
  // Key derivation
  // -------------------------------------------------------------------------

  /**
   * The set of routing keys currently registered on the exchange.
   *
   * A routing key appears in this set while at least one queue is
   * bound under it. The set is maintained by `bindQueue` (adds the
   * key) and `unbindQueue` (removes the key when its queue set becomes
   * empty).
   *
   * Used by `delete-exchange` and `unbindQueue` to enumerate the
   * exchange's bindings when they need to walk all of them, and by
   * `getBindings` to produce the routing-key → queues map.
   */
  getBindingsListKey(ns: string, name: string): string {
    return keys.getExchangeDirectKeys(ns, name).keyExchangeRoutingKeys;
  }

  /**
   * The set of queues bound under a specific routing key.
   *
   * `binding` is required for direct exchanges — the manager's arity
   * check prevents this method from being called without one. The
   * non-null assertion reflects that contract; a caller who reaches
   * here without a routing key has already bypassed the manager's
   * validation and will get a Redis key derived from `undefined`,
   * which surfaces as an empty result rather than a crash.
   */
  getBindingQueuesKey(ns: string, name: string, binding?: string): string {
    return keys.getExchangeDirectRoutingKeyKeys(ns, name, binding!)
      .keyRoutingKeyQueues;
  }

  // -------------------------------------------------------------------------
  // Matching
  // -------------------------------------------------------------------------

  /**
   * Resolve a routing key to the queues a message published under it
   * should be delivered to.
   *
   * Two-step read:
   *
   *   1. Validate the exchange exists. A missing exchange is a
   *      distinct failure from "no matching queues", and the source
   *      reports it as `ExchangeNotFoundError`.
   *
   *   2. Look up the queue set for the routing key's normalized form.
   *
   * The two reads are sequenced, not parallel, because the existence
   * check is a precondition: on a missing exchange the second read
   * would return an empty array, and reporting that as a successful
   * match would obscure the real failure.
   *
   * The callback receives the resolved queue set on success. An empty
   * array is a valid result — the exchange exists but no queue is
   * bound under the routing key. Order is undefined; the result is
   * whatever order Redis's `SMEMBERS` produced.
   */
  matchQueues(
    client: IRedisClient,
    exchange: IExchangeParsedParams,
    routingKey: string | null,
    cb: ICallback<IQueueParams[]>,
  ): void {
    // Direct requires a routing key — the manager enforces this, but
    // a null here means a manager-level bug rather than a caller
    // error. Report it as a routing-key validation failure rather
    // than crashing on a `null` dereference below.
    routingKey = routingKey ?? '';
    const validated = validateRedisKey(routingKey);
    if (validated instanceof Error) {
      return cb(
        new InvalidExchangeRoutingKeyError({
          metadata: { exchange, routingKey },
        }),
      );
    }

    const result: IQueueParams[] = [];

    async.series(
      [
        // 1) Validate the exchange exists. The `required: true`
        //    argument tells `_validateExchange` to reject with
        //    `ExchangeNotFoundError` when the exchange's properties
        //    hash is absent.
        (next: ICallback) => _validateExchange(client, exchange, true, next),

        // 2) Read the queue set for the routing key. Pushing into
        //    `result` rather than returning the array keeps the
        //    series' callback types uniform — the first step
        //    produces no value, the second produces a list, and
        //    `async.series` is not typed for heterogeneous series
        //    results in this codebase.
        (next: ICallback) =>
          _getRoutingKeyBoundQueues(
            client,
            exchange,
            validated,
            (err, queues) => {
              if (err) return next(err);
              if (queues && queues.length) result.push(...queues);
              next();
            },
          ),
      ],
      (err) => {
        if (err) return cb(err);
        cb(null, result);
      },
    );
  }
}
