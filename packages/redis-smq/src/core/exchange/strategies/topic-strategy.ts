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
import {
  InvalidExchangeRoutingKeyError,
  InvalidTopicBindingPatternError,
} from '../../errors/index.js';
import { _getRoutingPatterns } from '../_/_get-routing-patterns.js';
import { _getRoutingPatternBoundQueues } from '../_/_get-routing-pattern-bound-queues.js';
import { _matchRoutingKey } from '../_/_match-routing-key.js';
import { _validateRoutingPattern } from '../_/_validate-routing-pattern.js';
import {
  EExchangeType,
  type IExchangeParsedParams,
  type IExchangeStrategy,
  type IQueueParams,
} from '../../../contracts/index.js';

/**
 * Topic exchange strategy.
 *
 * Routes by pattern match: a message published under routing key `k`
 * reaches every queue whose binding pattern matches `k`, using
 * AMQP-style wildcards on dot-separated tokens (`*` = one token,
 * `#` = zero or more).
 *
 * Topic is the nontrivial strategy: `matchQueues` reads the exchange's
 * pattern set, filters by match, then reads and unions the bound-queue
 * sets of the matching patterns. Direct and fanout each do a single
 * Redis read.
 */
export class TopicStrategy implements IExchangeStrategy {
  readonly type = EExchangeType.TOPIC;
  readonly bindingRequired = true;

  // -------------------------------------------------------------------------
  // Binding validation
  // -------------------------------------------------------------------------

  /**
   * Validate a binding pattern.
   *
   * A valid pattern is a dot-separated sequence of tokens, each one of
   * `*`, `#`, or a literal identifier. Leading, trailing, and doubled
   * dots are rejected. Returns `null` on success, or
   * `InvalidTopicBindingPatternError` with the offending pattern in
   * its metadata.
   */
  validateBinding(binding: string): Error | string {
    if (_validateRoutingPattern(binding)) return binding;
    return new InvalidTopicBindingPatternError({
      metadata: { pattern: binding },
    });
  }

  // -------------------------------------------------------------------------
  // Key derivation
  // -------------------------------------------------------------------------

  /**
   * The exchange's set of registered binding patterns. A pattern is
   * present while at least one queue is bound under it.
   */
  getBindingsListKey(ns: string, name: string): string {
    return keys.getExchangeTopicKeys(ns, name).keyExchangeBindingPatterns;
  }

  /**
   * The set of queues bound under a specific binding pattern.
   */
  getBindingQueuesKey(ns: string, name: string, binding?: string): string {
    return keys.getExchangeTopicBindingPatternKeys(ns, name, binding!)
      .keyBindingPatternQueues;
  }

  // -------------------------------------------------------------------------
  // Matching
  // -------------------------------------------------------------------------

  /**
   * Resolve a routing key to the queues whose binding patterns match
   * it.
   *
   * The routing key is trimmed before use; a value that is empty after
   * trimming rejects with `InvalidExchangeRoutingKeyError` carrying the
   * original (untrimmed) value in its metadata, so a caller can see
   * exactly what was passed.
   *
   * The trimmed value is what gets matched against patterns. A queue
   * bound under two matching patterns appears once in the result: the
   * union is keyed on `${name}@${ns}`, the queue's composite identity.
   *
   * The exchange's existence is not validated. A missing exchange and
   * an exchange with no bindings are indistinguishable through the
   * pattern-set read — both produce an empty result. Callers who need
   * the distinction use `getProperties` or `exists`.
   */
  matchQueues(
    client: IRedisClient,
    exchange: IExchangeParsedParams,
    routingKey: string | null,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const trimmed = (routingKey ?? '').trim();
    if (!trimmed) {
      return cb(
        new InvalidExchangeRoutingKeyError({
          metadata: { exchange, routingKey: routingKey ?? '' },
        }),
      );
    }

    _getRoutingPatterns(client, exchange, (patternsErr, patterns) => {
      if (patternsErr) return cb(patternsErr);

      const allPatterns = patterns ?? [];
      if (allPatterns.length === 0) return cb(null, []);

      const matched = allPatterns.filter((p) => _matchRoutingKey(trimmed, p));
      if (matched.length === 0) return cb(null, []);

      const union = new Map<string, IQueueParams>();

      const tasks = matched.map((pattern) => (next: ICallback<void>) => {
        _getRoutingPatternBoundQueues(
          client,
          pattern,
          exchange,
          (queuesErr, queues) => {
            if (queuesErr) return next(queuesErr);
            for (const q of queues ?? []) {
              union.set(`${q.name}@${q.ns}`, q);
            }
            next();
          },
        );
      });

      async.parallel(tasks, (parallelErr) => {
        if (parallelErr) return cb(parallelErr);
        cb(null, Array.from(union.values()));
      });
    });
  }
}
