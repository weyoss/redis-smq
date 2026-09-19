/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueueParams } from '../queue-manager/queue.js';

/**
 * Exchange routing model.
 *
 * Determines how a message published to an exchange is matched to the
 * queues bound to it:
 *
 *   - DIRECT: exact routing key match. A message with routing key `k`
 *     reaches every queue bound with the same key `k`.
 *
 *   - TOPIC: pattern-based routing. The message's routing key is matched
 *     against the binding pattern of each bound queue, using AMQP-style
 *     wildcards (`*` for one token, `#` for zero or more tokens).
 *
 *   - FANOUT: broadcast. Every queue bound to the exchange receives a
 *     copy, regardless of routing key.
 *
 * The integer values are persisted in Redis (as the `TYPE` field of the
 * exchange's properties hash) and passed as arguments to the exchange
 * Lua scripts. Reordering or renumbering is a breaking change to
 * persisted data.
 */
export enum EExchangeType {
  DIRECT,
  FANOUT,
  TOPIC,
}

/**
 * Which queue types an exchange accepts bindings from.
 *
 * An exchange is created with a queue policy, and that policy is
 * enforced on every subsequent `bindQueue`. Attempting to bind a queue
 * whose type does not match the exchange's policy fails with
 * `ExchangeQueuePolicyMismatchError`.
 *
 * The policy exists because the two categories of queues have different
 * message-ordering semantics and different pending data structures:
 *
 *   - STANDARD: FIFO and LIFO queues. Messages flow through Redis lists;
 *     ordering is first-in-first-out or last-in-first-out depending on
 *     the queue type.
 *
 *   - PRIORITY: PRIORITY_QUEUE queues. Messages flow through a Redis
 *     sorted set scored by priority; ordering is by priority level, then
 *     by insertion order within a level.
 *
 * Mixing the two under a single exchange would make the exchange's
 * behavior ambiguous. The library refuses the mix rather than silently
 * picking one semantics over the other.
 *
 * The integer values are persisted in Redis (as the `QUEUE_POLICY` field
 * of the exchange's properties hash). Reordering or renumbering is a
 * breaking change to persisted data.
 */
export enum EExchangeQueuePolicy {
  STANDARD,
  PRIORITY,
}

/**
 * Field names for the exchange's properties hash in Redis.
 *
 * The integer values are hash field keys — the exchange's properties
 * hash stores values keyed by these numbers, and the exchange scripts
 * pass them as ARGV constants. Reordering or renumbering is a breaking
 * change to persisted data.
 *
 * This enum is exported by the current public surface. It is arguably an
 * internal detail (the Redis hash layout) rather than a user-facing
 * concept; a future major release could move it to an internal
 * directory.
 */
export enum EExchangeProperty {
  TYPE = 0,
  QUEUE_POLICY,
}

/**
 * Identifies an exchange by name and namespace.
 *
 * The namespace is optional in the public API — when omitted, it
 * defaults to the configured default namespace. The `IExchangeParams`
 * type does not model that optionality; it always carries both fields.
 * The optionality is handled at the API boundary, where a caller can
 * pass a string or `{ name, ns }`, and the value is resolved before
 * reaching anything typed as `IExchangeParams`.
 */
export interface IExchangeParams {
  name: string;
  ns: string;
}

/**
 * An exchange with its routing type resolved.
 *
 * This is the shape returned by discovery methods (`IExchange`'s three
 * queries) and stored in the exchange registry. It carries the `type`
 * because the same name and namespace can never refer to two different
 * exchange types — the type is fixed at creation time and cannot be
 * changed without deleting and recreating the exchange.
 */
export interface IExchangeParsedParams extends IExchangeParams {
  type: EExchangeType;
}

/**
 * The properties of an exchange as stored in Redis and read back by
 * `_getExchangeProperties`.
 *
 * Both fields are required. An exchange always has a type and a queue
 * policy — they are set at creation and never modified. There is no
 * "unset" state for either.
 *
 * Unlike `IQueueProperties`, there are no counters or state fields:
 * an exchange has no runtime state of its own. Whether it has bound
 * queues, and which, is discovered by reading the exchange's binding
 * sets, not by reading a property.
 */
export interface IExchangeProperties {
  type: EExchangeType;
  queuePolicy: EExchangeQueuePolicy;
}

// ---------------------------------------------------------------------------
// Binding shapes
// ---------------------------------------------------------------------------

/**
 * A direct exchange's bindings.
 *
 * Keys are routing keys; values are the queues bound under each key.
 * A routing key with no bound queues never appears as a key — the map
 * only lists bindings that have at least one queue.
 *
 * This shape is the return of `IExchangeManager.getBindings` for a
 * direct exchange and of `IExchangeDirect.getBindings`.
 */
export type TDirectBindings = Record<string, IQueueParams[]>;

/**
 * A topic exchange's bindings.
 *
 * Keys are binding patterns; values are the queues bound under each
 * pattern. A pattern with no bound queues never appears as a key — the
 * map only lists bindings that have at least one queue.
 *
 * Structurally identical to `TDirectBindings` — both are
 * `Record<string, IQueueParams[]>` — but declared as a distinct alias
 * so that a future divergence (for example, if topic bindings gain a
 * per-pattern score or priority field) does not silently affect callers
 * who only asked for direct bindings. The two are currently
 * interchangeable at the type level; the distinct names document
 * which exchange type each is meant for.
 *
 * This shape is the return of `IExchangeManager.getBindings` for a
 * topic exchange and of `IExchangeTopic.getBindings`.
 */
export type TTopicBindings = Record<string, IQueueParams[]>;

/**
 * A fanout exchange's bindings.
 *
 * A fanout exchange has no binding key — a queue is either bound to
 * the exchange or it is not, and the binding carries no additional
 * information. The bindings are therefore a flat list rather than a
 * map.
 *
 * This shape is the return of `IExchangeManager.getBindings` for a
 * fanout exchange and of `IExchangeFanout.getBindings`. It is also
 * what `IExchangeFanout.matchQueues` returns, since for a fanout
 * exchange the match result is the entire binding set.
 */
export type TFanoutBindings = IQueueParams[];

/**
 * The union of all binding shapes.
 *
 * This is `IExchangeManager.getBindings`'s return type. A caller who
 * knows the exchange type at compile time should use the concrete
 * facade (`IExchangeDirect`, `IExchangeTopic`, `IExchangeFanout`),
 * whose `getBindings` returns the specific shape without a union.
 *
 * The union exists because the manager's audience is callers who carry
 * the exchange type as a *runtime* value — an `EExchangeType` read
 * from a config, a parameter passed through a dispatch function. Those
 * callers narrow the result at the call site:
 *
 *     const bindings = await manager.getBindings(ex, type);
 *     if (type === EExchangeType.FANOUT) {
 *       // bindings is narrowed to IQueueParams[]
 *       for (const queue of bindings) { … }
 *     } else {
 *       // bindings is narrowed to Record<string, IQueueParams[]>
 *       for (const [key, queues] of Object.entries(bindings)) { … }
 *     }
 *
 * The alternative — overloading `getBindings` on `type` so that each
 * literal `EExchangeType` narrows the return — would give callers a
 * precise type without the runtime check, at the cost of four overload
 * signatures per form (promise, promise-with-type, callback,
 * callback-with-type). The union is the honest shape for the
 * audience; the facades serve the callers who want precision without
 * the check.
 */
export type TExchangeBindings =
  TDirectBindings | TTopicBindings | TFanoutBindings;
