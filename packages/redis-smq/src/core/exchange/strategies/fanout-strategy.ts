/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import { _getBoundQueues } from '../_/_get-bound-queues.js';
import {
  EExchangeType,
  type IExchangeParsedParams,
  type IExchangeStrategy,
  type IQueueParams,
} from '../../../contracts/index.js';
import { InvalidFanoutExchangeParametersError } from '../../errors/index.js';

/**
 * Fanout exchange strategy.
 *
 * A fanout exchange broadcasts: a message published under any routing
 * key reaches every queue bound to the exchange. There is no key to
 * match, no pattern to apply, and no distinction between bindings — the
 * exchange's set of bound queues *is* its complete routing table.
 *
 * THE DEGENERATE STRATEGY:
 *
 *   Fanout is the member of the family where several of the strategy
 *   interface's questions have trivial answers:
 *
 *     - `bindingRequired` is `false` — a binding is not part of a
 *       fanout binding.
 *
 *     - `validateBinding` is a no-op — there is no binding to
 *       validate. The manager's arity check rejects a supplied
 *       binding before this method is called, so the method's body
 *       is never reached with a meaningful argument.
 *
 *     - `getBindingsListKey` returns `null` — fanout has no bindings
 *       list. The `null` return is the signal the operations branch
 *       on to take their flat (non-list-backed) path.
 *
 *     - `getBindingQueuesKey` ignores the binding argument — the
 *       fanout exchange has exactly one queue set.
 *
 *     - `matchQueues` ignores the routing key — every bound queue is
 *       a match.
 *
 *   The strategy exists to satisfy the interface contract, but its
 *   most important contribution is the two `null`-shaped answers
 *   (`getBindingsListKey` returns `null`, and the arity check the
 *   manager performs from `bindingRequired`). Those two are what
 *   cause the shared operations in `operations/*` to take their
 *   fanout-specific branches — the branches are written as "if there
 *   is no bindings list, do X", and this strategy is the source of
 *   the condition.
 */
export class FanoutStrategy implements IExchangeStrategy {
  /**
   * Fanout exchanges are identified by `EExchangeType.FANOUT` in both
   * the properties hash and the persisted routing model. See
   * `EExchangeType` for the persistence contract.
   */
  readonly type = EExchangeType.FANOUT;

  /**
   * A fanout exchange binding carries no additional information — a
   * queue is either bound to the exchange or it is not. The manager's
   * arity check uses this to reject a `bindQueue` or `unbindQueue`
   * call that supplies a binding before any Redis round-trip, and to
   * reject a `matchQueues` call that supplies a routing key.
   */
  readonly bindingRequired = false;

  // -------------------------------------------------------------------------
  // Binding validation
  // -------------------------------------------------------------------------

  /**
   * No-op: a fanout exchange has no binding to validate.
   *
   * This method is never called with a meaningful argument. The
   * manager's arity check rejects a supplied binding before
   * dispatching to the strategy, and when no binding is supplied this
   * method is not called at all (see `_bindQueue` and `_unbindQueue`
   * — the call to `validateBinding` is guarded by `if (binding != null)`).
   */
  validateBinding(): Error | string {
    return new InvalidFanoutExchangeParametersError();
  }

  // -------------------------------------------------------------------------
  // Key derivation
  // -------------------------------------------------------------------------

  /**
   * `null` — a fanout exchange has no bindings list.
   *
   * The `null` return is the strategy's most important contribution to
   * the shared operations: `delete-exchange` and `unbind-queue` both
   * branch on this value, taking their flat (non-list-backed) path
   * when it is `null`. Returning a key here — say, a synthetic
   * "bindings list" that is never populated — would cause those
   * operations to run their direct/topic logic against an empty list,
   * which would produce the correct outcome by accident but would
   * obscure the fact that fanout's shape is different.
   *
   * The `ns` and `name` parameters are unused; the signature is
   * declared on the interface because the two list-backed strategies
   * need them, and TypeScript's structural typing requires this class
   * to accept the same arguments even when it ignores them.
   */
  getBindingsListKey(): string | null {
    return null;
  }

  /**
   * The exchange's single set of bound queues.
   *
   * The `binding` argument is ignored: fanout has one queue set, not
   * one per binding. The manager's arity check ensures `binding` is
   * `undefined` when this method is called for a fanout exchange
   * (the call in `_bindQueue` / `_unbindQueue` passes `binding ?? undefined`,
   * and `binding` is `null` for fanout), so this method receives
   * `undefined` at every well-formed call site. The argument remains
   * in the signature for interface compatibility.
   */
  getBindingQueuesKey(ns: string, name: string): string {
    return keys.getExchangeFanoutKeys(ns, name).keyFanoutQueues;
  }

  // -------------------------------------------------------------------------
  // Matching
  // -------------------------------------------------------------------------

  /**
   * Return every queue bound to the exchange.
   *
   * The routing key is ignored — every bound queue is a match for a
   * fanout exchange, regardless of the key. The manager's arity check
   * rejects a caller-supplied routing key on a `matchQueues` call for
   * a fanout exchange, so this method is always called with a `null`
   * routing key at a well-formed call site.
   *
   * No existence check is performed; a missing exchange and an
   * exchange with no bound queues both produce an empty result. See
   * the file header for the reasoning.
   *
   * Order is undefined; the result is whatever order `SSCAN` produced.
   */
  matchQueues(
    client: IRedisClient,
    exchange: IExchangeParsedParams,
    _routingKey: string | null,
    cb: ICallback<IQueueParams[]>,
  ): void {
    _getBoundQueues(client, exchange, cb);
  }
}
