/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../queue-manager/index.js';
import { IConsumerMessageHandlerParams } from '../message-handler/types/index.js';

/**
 * A registered message handler configuration.
 *
 * The registry stores handler *configs*, not live instances. The runner
 * owns the live instances and uses the registry to answer
 * "is this the same handler?" consistently across all call sites.
 *
 * Field semantics:
 *
 *   - `params` is stored by reference. The runner mutates `params.queue`
 *     when it resolves an ephemeral group ID (see
 *     MessageHandlerRunner.addMessageHandler), and the registry sees the
 *     mutation because it holds the same object.
 *
 *   - `ephemeralGroupId` is captured once, at registration time, and never
 *     changes. It is the group ID the runner will delete when the handler
 *     is REMOVED (cancel or consumer shutdown) — and only when the handler
 *     is removed, not when it is merely stopped for a queue state
 *     transition. See MessageHandlerRunner.removeHandlerInstance for the
 *     removal path and stopMessageHandler for the stop path.
 *
 *     Capturing it here rather than re-deriving it at removal time matters
 *     because the ephemeral pattern (`cid-<consumerId>`) is deterministic,
 *     but the queue's groupId may have been reset between registration and
 *     removal (e.g., by a partial sync or by a caller that rebuilt the
 *     config from an unparsed form). Reading it from the entry makes
 *     removal independent of what the queue currently looks like.
 */
export interface IRegisteredHandler {
  readonly params: IConsumerMessageHandlerParams;
  readonly ephemeralGroupId: string | null;
}

/**
 * The registry is the single source of truth for "which handlers are
 * configured on this consumer."
 *
 * It owns the canonical identity function every lookup in the consumer
 * uses. Keeping this function here — rather than duplicated across the
 * runner, the state-change handler, and the handlers themselves — is what
 * prevents the identity-mismatch class of bugs (see issue #4 in the
 * review).
 *
 * Scope:
 *   - Owns: the list of registered configs.
 *   - Owns: the canonical key function and the loose-match predicate.
 *   - Owns: the ephemeral consumer group ID associated with each config.
 *   - Does NOT own: live handler instances (that's MessageHandlerRunner).
 *   - Does NOT own: queue state, scheduling, lifecycle.
 *
 * The registry is a read model. It performs no I/O and has no lifecycle.
 * Every method is synchronous.
 */
export class HandlerRegistry {
  private readonly entries: IRegisteredHandler[] = [];

  /**
   * Strict canonical key for a queue.
   *
   * Both `null` and `''` for `groupId` produce the same key — neither is
   * a valid consumer group ID, and both mean "no group."
   *
   * Use this for identity comparisons between two KNOWN queues where an
   * exact match is required. Examples:
   *   - comparing a running handler's queue against its config entry to
   *     detect whether the runner needs to sync an ephemeral group ID;
   *   - the supervisor's runningQueues set, where both sides are
   *     post-sync configs.
   *
   * Do NOT use this for lookups driven by a caller-supplied queue that
   * may have `groupId: null` — see `matches()`.
   */
  getKey(queue: IQueueParsedParams): string {
    return `${queue.queueParams.ns}:${queue.queueParams.name}:${queue.groupId ?? ''}`;
  }

  /**
   * Loose identity test.
   *
   * Two queues match if they have the same (ns, name), and either:
   *   - the LOOKUP's groupId is null (matches any group on that queue), or
   *   - both groupIds are equal.
   *
   * The rule is asymmetric: the caller-supplied lookup controls whether
   * the groupId is significant. This is what lets
   * `consumer.cancel('queue')` — which parses to
   * `{ queueParams, groupId: null }` — find a handler whose effective
   * groupId was generated internally as `cid-<consumerId>`. Without the
   * loose rule, that lookup would fail and the handler would keep running
   * after `cancel` returned (issue #4).
   *
   * Use this whenever the lookup queue comes from a caller who may not
   * know the effective group ID:
   *   - get / has / remove on the registry;
   *   - getMessageHandlerInstance in the runner (it scans live instances).
   */
  matches(candidate: IQueueParsedParams, lookup: IQueueParsedParams): boolean {
    if (
      candidate.queueParams.ns !== lookup.queueParams.ns ||
      candidate.queueParams.name !== lookup.queueParams.name
    ) {
      return false;
    }
    if (lookup.groupId === null) return true;
    return candidate.groupId === lookup.groupId;
  }

  /**
   * Look up a registered handler by queue.
   *
   * Uses `matches`, so a lookup with `groupId: null` matches any group on
   * the same (ns, name) — the semantics `consumer.cancel('queue')` relies
   * on. A lookup with a specific groupId requires an exact match.
   */
  get(queue: IQueueParsedParams): IRegisteredHandler | undefined {
    return this.entries.find((e) => this.matches(e.params.queue, queue));
  }

  has(queue: IQueueParsedParams): boolean {
    return this.get(queue) !== undefined;
  }

  /**
   * Register a handler.
   *
   * `ephemeralGroupId` is the effective group ID if the runner generated
   * it for an ephemeral PUB/SUB consumer, or null otherwise. Capturing it
   * here means the removal path does not need to re-derive it, which
   * would fail on restart when the config already carries the generated
   * ID and `_prepareConsumerGroup` has nothing to change.
   *
   * Returns `false` if a handler with the same (loosely-matched) identity
   * is already present.
   *
   * The registry stores `params` by reference. Callers that later mutate
   * `params.queue` (see the ephemeral-group sync in
   * MessageHandlerRunner.addMessageHandler) mutate the entry the registry
   * sees, which is what keeps subsequent lookups consistent.
   */
  add(
    params: IConsumerMessageHandlerParams,
    ephemeralGroupId: string | null,
  ): boolean {
    if (this.has(params.queue)) return false;
    this.entries.push({ params, ephemeralGroupId });
    return true;
  }

  /**
   * Remove a handler by queue. Returns the removed entry, or `undefined`
   * if none was registered.
   *
   * Uses `matches`, so `cancel('queue')` removes the config even when the
   * config carries an ephemeral group ID.
   *
   * The caller is responsible for the removed entry's ephemeral group
   * deletion (if `entry.ephemeralGroupId !== null`). The registry does not
   * perform I/O and cannot do this itself.
   */
  remove(queue: IQueueParsedParams): IRegisteredHandler | undefined {
    const index = this.entries.findIndex((e) =>
      this.matches(e.params.queue, queue),
    );
    if (index < 0) return undefined;
    return this.entries.splice(index, 1)[0];
  }

  /**
   * All registered handlers, in registration order.
   *
   * Returns the live backing array. Callers must not mutate it. This is a
   * deliberate choice: it lets callers iterate without allocating, and
   * every mutation path in the consumer goes through
   * `add`/`remove`/`clear` anyway.
   */
  list(): readonly IRegisteredHandler[] {
    return this.entries;
  }

  clear(): void {
    this.entries.length = 0;
  }

  get size(): number {
    return this.entries.length;
  }
}
