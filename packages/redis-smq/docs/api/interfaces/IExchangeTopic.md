[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IExchangeTopic

# Interface: IExchangeTopic

Topic exchange: routes messages by pattern matching.

A message published to a topic exchange with routing key `k` is
delivered to every queue bound under a pattern that matches `k`. The
matching uses AMQP-style wildcards on dot-separated tokens:

- `*` matches exactly one token
- `#` matches zero or more tokens
- any other token matches itself literally

## Example

```ts
// Patterns and their matches
// "order.created"     matches  "order.created"
// "order.*"           matches  "order.created", "order.cancelled"
//                     does not match  "order.line.created"
// "order.#"           matches  "order.created", "order.line.created",
//                     "order" (zero tokens after "order")
// "#.created"         matches  "order.created", "user.profile.created",
//                     "created" (zero tokens before "created")
// "#"                 matches  everything

Topic exchange is the correct choice when routing keys are structured
(hierarchical tokens) and a single message should reach every queue
that has expressed interest in its category.

Extends `IExchange` for the read-only discovery methods
(`getAllExchanges`, `getNamespaceExchanges`, `getQueueExchanges`).
This interface adds the topic-specific operations.

Both the promise and callback forms are declared for every
asynchronous method, matching the concrete class.
```

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingPattern`): `Promise`\<`void`\>

Binds a queue to the exchange under a binding pattern.

The queue's namespace must match the exchange's namespace — a
cross-namespace binding fails with `NamespaceMismatchError`. The
queue's type must match the exchange's queue policy; a mismatch
fails with `ExchangeQueuePolicyMismatchError`.

The pattern must be a valid topic pattern: dot-separated tokens,
where each token is either `*`, `#`, or a literal matching
`[A-Za-z][A-Za-z0-9]*(-|_)?[A-Za-z0-9]*`. Leading, trailing, and
doubled dots are rejected. An invalid pattern fails with
`InvalidTopicBindingPatternError`.

Binding a queue that is already bound under the same pattern is a
no-op (with a debug log), not an error. Rebinding under a different
pattern is allowed — a queue can be bound to the same exchange under
multiple patterns, and a message that matches any of them is
delivered once.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingPattern

`string`

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingPattern

`string`

###### cb

`ICallback`

##### Returns

`void`

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a topic exchange.

The queue policy is fixed at creation time and cannot be changed.
Every subsequent `bindQueue` for this exchange must target a queue
whose type matches the policy; binding a queue of the wrong category
fails with `ExchangeQueuePolicyMismatchError`.

Creating an exchange that already exists fails with
`ExchangeAlreadyExistsError`.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

Exchange name or `{ name, ns }`. A bare name is
resolved against the configured default namespace.

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

STANDARD (FIFO and LIFO queues) or PRIORITY
(PRIORITY_QUEUE queues).

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

###### cb

`ICallback`

##### Returns

`void`

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Deletes a topic exchange.

Deletion is refused with `ExchangeHasBoundQueuesError` while any
binding pattern still has bound queues. Unbind every queue from
every pattern first.

Once the exchange is deleted, its binding patterns and their
pattern-to-queues sets are removed. The queues that were bound
remain in place; only the bindings are gone.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`

##### Returns

`void`

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<`Record`\<`string`, [`IQueueParams`](IQueueParams.md)[]\>\>

Returns the exchange's complete binding map.

The result is a `Record<string, IQueueParams[]>` whose keys are
binding patterns and whose values are the queues bound under each
pattern. A pattern with no queues never appears as a key — the map
only lists patterns that have at least one binding.

Order of keys and of queues within each key is undefined.

This is a snapshot: it reads the pattern set, then reads each
pattern's bound queues in sequence. A binding added or removed while
the snapshot is being taken may or may not appear in the result,
depending on the order of the underlying reads. Exchanges have no
state lock; callers who need a consistent view must coordinate with
the writers at a higher level (for example, by ensuring no bindQueue
or unbindQueue calls are in flight against this exchange).

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<`Record`\<`string`, [`IQueueParams`](IQueueParams.md)[]\>\>

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<`Record`\<`string`, [`IQueueParams`](IQueueParams.md)[]\>\>

##### Returns

`void`

---

### getRoutingPatternBoundQueues()

#### Call Signature

> **getRoutingPatternBoundQueues**(`exchange`, `bindingPattern`): `Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

Returns every queue bound to the exchange under a specific binding
pattern.

Symmetric with `matchQueues` but named for the query perspective:
`matchQueues` describes the producer's question ("where does this
routing key go?"), `getRoutingPatternBoundQueues` describes the
caller's question ("who is listening to this pattern?").

The pattern is not validated — a pattern that isn't currently
registered simply returns an empty array. This differs from
`bindQueue`, which validates the pattern's syntax. The asymmetry is
intentional: a query for an unregistered pattern is not an error,
while a bind to a malformed pattern is.

Returns an empty array if the pattern has no bound queues. Does not
distinguish between "pattern exists with no queues" and "pattern
does not exist" — both produce an empty array.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### bindingPattern

`string`

##### Returns

`Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

#### Call Signature

> **getRoutingPatternBoundQueues**(`exchange`, `bindingPattern`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### bindingPattern

`string`

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

---

### getRoutingPatterns()

#### Call Signature

> **getRoutingPatterns**(`exchange`): `Promise`\<`string`[]\>

Returns every binding pattern registered on the exchange.

A pattern is registered when at least one queue is bound under it.
Removing the last queue bound to a pattern removes the pattern from
the set. The result is a flat list of strings; order is undefined.

Returns an empty array if the exchange exists but has no bindings,
or if the exchange does not exist.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<`string`[]\>

#### Call Signature

> **getRoutingPatterns**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<`string`[]\>

##### Returns

`void`

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

Returns every queue that would receive a message with the given
routing key.

Used by the producer at publish time to resolve the exchange's
targets. The lookup:

1. Reads the exchange's binding patterns.
2. Filters to patterns that match the routing key.
3. Unions the bound queues of those patterns.

A queue bound under two matching patterns appears once in the
result. A routing key that matches no pattern returns an empty
array. A missing exchange rejects with `ExchangeNotFoundError`.

Order of the returned queues is undefined.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingKey

`string`

##### Returns

`Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingKey

`string`

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingPattern`): `Promise`\<`void`\>

Unbinds a queue from the exchange under a binding pattern.

The binding must exist: unbinding a queue that is not bound under
the given pattern fails with `QueueNotBoundError`.

If the queue is bound under other patterns on the same exchange,
those bindings remain in place. Only the specified pattern is
removed.

If the specified pattern's queue set becomes empty, the pattern
itself is removed from the exchange's pattern set. If the last
binding for the queue was on this exchange across all patterns, the
exchange is removed from the queue's binding list.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingPattern

`string`

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingPattern

`string`

###### cb

`ICallback`

##### Returns

`void`
