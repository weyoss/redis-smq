[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IExchangeStrategy

# Interface: IExchangeStrategy

The type-specific half of exchange operations.

`ExchangeManager` owns the transactional core — parameter parsing,
namespace checks, operation validation, WATCH/MULTI bodies, error
mapping — and delegates the parts that genuinely vary between direct,
topic, and fanout exchanges to a strategy. Every strategy answers the
same handful of questions:

1. What enum value identifies this exchange type?
2. Does `bindQueue`/`unbindQueue` require a binding argument for
   this type? (Routing key for direct, pattern for topic, no
   binding for fanout.)
3. Is a given binding syntactically valid for this type?
4. Which Redis key holds the exchange's list of all bindings?
   (Null for fanout — there is no such list.)
5. Which Redis key holds the queues bound under a specific binding?
   (For fanout, this is the exchange's single bound-queues set, and
   the binding argument is ignored.)
6. Given a routing key, which queues should a message published
   under that key be delivered to?

The first five are data — a key derivation or a boolean. The sixth is
an algorithm, and it is the only method on this interface whose
implementation genuinely differs in shape across the three types:

- DIRECT: one `SMEMBERS` on the binding-queues key derived from
  the routing key.

- TOPIC: read the set of all binding patterns, filter it to the
  patterns that match the routing key, then read each matching
  pattern's bound-queues set and union the results. A queue bound
  under two matching patterns appears once in the result.

- FANOUT: read the exchange's single bound-queues set. The routing
  key plays no role; the manager has already rejected calls that
  supply one.

Parameterizing `matchQueues` rather than implementing it here would
require the strategy to expose the _intermediate_ keys and sets
involved (patterns, per-pattern queue sets, the routing-key → queues
key, …) and then have the manager assemble them. For direct and
fanout that would be a single extra key with no benefit; for topic it
would require the manager to know that "filter patterns by match"
happens between two reads. The strategy is the right place for that
knowledge, because it is the only component that knows the topic
exchange's storage layout.

## Properties

### bindingRequired

> `readonly` **bindingRequired**: `boolean`

Whether `bindQueue` and `unbindQueue` require a binding argument.

- DIRECT: `true` — the routing key.
- TOPIC: `true` — the binding pattern.
- FANOUT: `false` — a queue is either bound to a fanout exchange
  or it is not; the binding carries no
  additional information.

The manager uses this to reject an arity mismatch _before_ any
Redis round-trip. Two cases:

- A type that requires a binding was called without one — a
  caller error, reported as `InvalidExchangeParametersError`.
- A type that forbids a binding was called with one — also a
  caller error, same class.

Both are rejected at the boundary rather than at the Redis layer,
so a caller who typed `bindQueue(queue, ex)` against a direct
exchange gets the error immediately rather than after a `WATCH`
round-trip.

---

### type

> `readonly` **type**: [`EExchangeType`](../enumerations/EExchangeType.md)

The exchange type this strategy implements.

Used by the manager for logging and by the registry to key the
singleton map. It is redundant with the concrete class's identity,
but exposing it lets the manager verify that the strategy it
obtained matches the type the caller supplied — a defensive check
against a registry bug, not a runtime concern for correct callers.

## Methods

### getBindingQueuesKey()

> **getBindingQueuesKey**(`ns`, `name`, `binding?`): `string`

The Redis key holding the queues bound under a specific binding.

- DIRECT: the queue set for `binding` (the routing key).
- TOPIC: the queue set for `binding` (the pattern).
- FANOUT: the exchange's single bound-queues set. The `binding`
  argument is ignored — fanout exchanges have exactly one such
  set.

The parameter is optional to reflect fanout's signature. Direct and
topic implementations treat an omitted argument as a programming
error (their callers are contractually required to pass it), but the
interface does not enforce this at the type level because the
manager already enforces the arity check via `bindingRequired`
before reaching this method.

#### Parameters

##### ns

`string`

##### name

`string`

##### binding?

`string`

#### Returns

`string`

---

### getBindingsListKey()

> **getBindingsListKey**(`ns`, `name`): `string` \| `null`

The Redis key holding the exchange's set of all bindings.

- DIRECT: the set of routing keys, one entry per key currently in
  use by at least one queue.
- TOPIC: the set of binding patterns, one entry per pattern
  currently in use by at least one queue.
- FANOUT: `null` — there is no such set; the exchange's bound
  queues are the entire routing table.

Used by `getBindings`, `delete`, and `unbindQueue` to enumerate the
exchange's bindings when the manager needs to walk all of them.
Fanout's `null` signals "no enumeration needed" — the manager
branches on it once and handles fanout as a special case.

#### Parameters

##### ns

`string`

##### name

`string`

#### Returns

`string` \| `null`

---

### matchQueues()

> **matchQueues**(`client`, `exchange`, `routingKey`, `cb`): `void`

Resolve a routing key to the set of queues that should receive a
message published under it.

This is the only method on the interface whose implementation
differs in _shape_ between the three types — see the file header
for the per-type algorithm.

The manager supplies:

- `client` — a pooled Redis connection acquired once for the
  whole operation. The strategy must not acquire its own.
- `exchange` — the parsed exchange params. Strategies are called
  only by the exchange manager, which validates the exchange's
  existence — rejecting with `ExchangeNotFoundError` — before
  dispatching. A strategy may therefore assume the exchange exists;
  it is not free to observe the missing-exchange case, and none of
  the three does. An empty result from `matchQueues` means the
  exchange exists and nothing matched; the manager does not
  translate that into an error, and the producer raises
  `NoMatchingQueuesError` at its own boundary.
- `routingKey` — the caller-supplied routing key. `null` for
  fanout, where the argument is meaningless. Direct and topic
  strategies may assume a non-null value; the manager enforces
  the arity before dispatching.

The callback receives the resolved queue set. Order is undefined;
the direct and fanout strategies return whatever order the
underlying `SMEMBERS` produced, and the topic strategy returns the
union of its reads in the order it happened to visit them. Callers
that need a stable order sort the result.

An empty array is a valid, non-error result — it means "the
exchange exists (or doesn't) and nothing matched". The manager
does not translate an empty result into `NoMatchingQueuesError`;
that decision belongs to the producer, which is the caller in
production.

#### Parameters

##### client

`IRedisClient`

##### exchange

[`IExchangeParsedParams`](IExchangeParsedParams.md)

##### routingKey

`string` \| `null`

##### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

#### Returns

`void`

---

### validateBinding()

> **validateBinding**(`binding`): `string` \| `Error`

Validate a binding and return its normalized form.

Returns the normalized binding on success, an error instance on
failure.

The normalization is the storage's canonical form:

- DIRECT: the routing key lowercased. `validateRedisKey` returns
  the lowercased form, and the exchange stores its bindings and
  queue sets under that form.

- TOPIC: the pattern unchanged. Patterns are case-sensitive —
  `order.#` and `Order.#` are distinct patterns — so
  normalization is a no-op for this type.

- FANOUT: not called with a meaningful argument; returns the
  argument unchanged for interface compatibility.

The caller MUST use the returned string for every subsequent key
derivation, storage write, and log line. Using the raw argument
would store the binding under its unnormalized form and produce a
key that a normalized lookup cannot find.

#### Parameters

##### binding

`string`

#### Returns

`string` \| `Error`
