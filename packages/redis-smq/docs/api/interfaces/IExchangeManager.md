[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IExchangeManager

# Interface: IExchangeManager

Unified manager for exchange operations.

The exchange's type is a property of the exchange, not of the call.
Only `create` takes a type — the operation that establishes it.
Every other operation reads the stored type from Redis and dispatches
internally.

A caller who knows the type at compile time uses the three facades
(`ExchangeDirect`, `ExchangeTopic`, `ExchangeFanout`); a caller who
carries the type as a runtime value uses this manager.

## Example

```ts
const mgr = new ExchangeManager();
await mgr.create('events', EExchangeType.DIRECT, EExchangeQueuePolicy.STANDARD);
await mgr.bindQueue('orders', 'events', 'order.created');
const queues = await mgr.matchQueues('events', 'order.created');
```

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `binding?`): `Promise`\<`void`\>

Bind a queue to an existing exchange.

The exchange must already exist; a missing exchange rejects with
`ExchangeNotFoundError`. To create an exchange and bind a queue to
it, call `create` first.

`binding` is the routing key for a direct exchange, the pattern for
a topic exchange, and must be omitted for a fanout exchange. The
type of the exchange determines which of the three the binding
means; the type is read from Redis, and the caller does not supply
it.

Preconditions:

- The queue must exist; a missing queue rejects with
  `QueueNotFoundError`.
- The queue and exchange must share a namespace; a cross-
  namespace bind rejects with `NamespaceMismatchError`.
- The queue's type must match the exchange's stored queue
  policy; a mismatch rejects with
  `ExchangeQueuePolicyMismatchError`.
- The binding, if supplied, must be valid for the exchange's
  type; an invalid binding rejects with
  `InvalidDirectExchangeParametersError` (direct) or
  `InvalidTopicBindingPatternError` (topic).
- The binding arity must match the exchange type: direct and
  topic require a binding, fanout forbids one. A mismatch
  rejects with `InvalidExchangeParametersError`.

Idempotency: binding a queue that is already bound under the same
`(exchange, binding)` pair is a no-op with a debug log, not an
error. Rebinding under a different binding is allowed — a queue
can be bound to the same exchange under multiple keys or patterns.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### binding?

`string`

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`

##### Returns

`void`

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `binding`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### binding

`string`

###### cb

`ICallback`

##### Returns

`void`

---

### create()

#### Call Signature

> **create**(`exchange`, `type`, `queuePolicy`): `Promise`\<`void`\>

Create an exchange.

The type and the queue policy are fixed at creation time and
cannot be changed. A second `create` against the same
`(ns, name)` rejects with `ExchangeAlreadyExistsError`, regardless
of whether the second call supplies the same type and policy or
different ones.

The queue policy constrains every subsequent `bindQueue`: a queue
whose type does not match the exchange's policy rejects with
`ExchangeQueuePolicyMismatchError`. See `EExchangeQueuePolicy` for
the two policy categories.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

Exchange name or `{ name, ns }`. A bare name is
resolved against the configured default namespace.

###### type

[`EExchangeType`](../enumerations/EExchangeType.md)

The exchange's routing model. See `EExchangeType`.

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

The queue category the exchange accepts.

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **create**(`exchange`, `type`, `queuePolicy`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### type

[`EExchangeType`](../enumerations/EExchangeType.md)

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

Delete an exchange.

Deletion is refused with `ExchangeHasBoundQueuesError` while any
queue is still bound. Unbind every queue first. The check is not
scoped to a single binding — an exchange with one binding that
still has one bound queue refuses just as an exchange with ten
bindings that each have one bound queue does.

Once the exchange is deleted, its bindings and their queue sets
are removed. The queues themselves remain; only the bindings are
gone.

Deleting a missing exchange rejects with `ExchangeNotFoundError`
— the operation is not idempotent in return value. A caller who
wants "ensure this is gone" catches the class and treats it as
success.

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

### exists()

#### Call Signature

> **exists**(`exchange`): `Promise`\<`boolean`\>

Whether the exchange exists.

Returns `false` for a missing exchange without rejecting. A
Redis-level error or an invalid namespace still rejects.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **exists**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### getAllExchanges()

#### Call Signature

> **getAllExchanges**(): `Promise`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

Every exchange across every namespace. Order is undefined. A
malformed entry in the registry is skipped with a warning rather
than failing the call.

##### Returns

`Promise`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

#### Call Signature

> **getAllExchanges**(`cb`): `void`

##### Parameters

###### cb

`ICallback`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

##### Returns

`void`

---

### getBindingQueues()

#### Call Signature

> **getBindingQueues**(`exchange`, `binding?`): `Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

The queues bound under a specific binding.

For a direct exchange the binding is a routing key; for a topic
exchange it is a binding pattern; for a fanout exchange the binding
is ignored and the call returns every bound queue.

A missing exchange produces an empty array — not an error. The
distinction from `matchQueues`, which rejects on a missing
exchange, preserves the source's behavior for the bound-queue
readers.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### binding?

`string`

##### Returns

`Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

#### Call Signature

> **getBindingQueues**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

#### Call Signature

> **getBindingQueues**(`exchange`, `binding`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### binding

`string`

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<[`TExchangeBindings`](../type-aliases/TExchangeBindings.md)\>

The exchange's complete binding map.

The concrete shape depends on the exchange's stored type:

- DIRECT: `Record<string, IQueueParams[]>` — routing key to
  bound queues.
- TOPIC: `Record<string, IQueueParams[]>` — pattern to bound
  queues.
- FANOUT: `IQueueParams[]` — the flat list of bound queues.

A binding with no queues never appears as a key in the direct or
topic results. Order is undefined.

A missing exchange rejects with `ExchangeNotFoundError`.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<[`TExchangeBindings`](../type-aliases/TExchangeBindings.md)\>

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<[`TExchangeBindings`](../type-aliases/TExchangeBindings.md)\>

##### Returns

`void`

---

### getBoundQueues()

#### Call Signature

> **getBoundQueues**(`exchange`): `Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

Requires the exchange to be FANOUT.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

#### Call Signature

> **getBoundQueues**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

---

### getNamespaceExchanges()

#### Call Signature

> **getNamespaceExchanges**(`ns`): `Promise`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

Every exchange in a single namespace. Order is undefined. An
invalid namespace rejects with `InvalidNamespaceError`.

##### Parameters

###### ns

`string`

##### Returns

`Promise`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

#### Call Signature

> **getNamespaceExchanges**(`ns`, `cb`): `void`

##### Parameters

###### ns

`string`

###### cb

`ICallback`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

##### Returns

`void`

---

### getProperties()

#### Call Signature

> **getProperties**(`exchange`): `Promise`\<[`IExchangeProperties`](IExchangeProperties.md)\>

Read the exchange's stored properties.

Returns the exchange's `type` and `queuePolicy` as they are
persisted. Rejects with `ExchangeNotFoundError` if the exchange
does not exist.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<[`IExchangeProperties`](IExchangeProperties.md)\>

#### Call Signature

> **getProperties**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<[`IExchangeProperties`](IExchangeProperties.md)\>

##### Returns

`void`

---

### getQueueExchanges()

#### Call Signature

> **getQueueExchanges**(`queue`): `Promise`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

Every exchange a queue is bound to. Order is undefined. A queue
with no bindings returns an empty list.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

#### Call Signature

> **getQueueExchanges**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<[`IExchangeParsedParams`](IExchangeParsedParams.md)[]\>

##### Returns

`void`

---

### getRoutingKeys()

#### Call Signature

> **getRoutingKeys**(`exchange`): `Promise`\<`string`[]\>

Requires the exchange to be DIRECT.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

##### Returns

`Promise`\<`string`[]\>

#### Call Signature

> **getRoutingKeys**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<`string`[]\>

##### Returns

`void`

---

### getRoutingPatterns()

#### Call Signature

> **getRoutingPatterns**(`exchange`): `Promise`\<`string`[]\>

Requires the exchange to be TOPIC.

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

> **matchQueues**(`exchange`, `routingKey?`): `Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

Resolve a routing key to the queues a message published under it
should be delivered to.

`routingKey` is required for a direct or topic exchange and must be
omitted for a fanout exchange. The requirement is checked against
the exchange's stored type:

- A fanout exchange given a routing key rejects with
  `InvalidFanoutExchangeParametersError`.
- A direct or topic exchange without a routing key rejects with
  `InvalidExchangeRoutingKeyError`.

The per-type matching algorithm:

- DIRECT: exact-match lookup on the routing key.
- TOPIC: pattern match against the exchange's binding patterns;
  queues bound under any matching pattern are unioned;
  a queue bound under two matching patterns appears once.
- FANOUT: every bound queue is a match.

Return shape: an empty array means "the exchange exists and nothing
matched". This is not an error at the manager layer — the producer
translates an empty result into `NoMatchingQueuesError` at its own
boundary.

A missing exchange rejects with `ExchangeNotFoundError`.

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### routingKey?

`string`

##### Returns

`Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

#### Call Signature

> **matchQueues**(`exchange`, `cb`): `void`

##### Parameters

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

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

> **unbindQueue**(`queue`, `exchange`, `binding?`): `Promise`\<`void`\>

Remove a binding.

The binding must exist: unbinding a queue that is not bound under
the given `(exchange, binding)` pair rejects with
`QueueNotBoundError`. Unlike `bindQueue`, this operation is not
idempotent in return value — a second call fails.

If the queue is bound under other bindings on the same exchange,
those bindings remain in place. Only the specified binding is
removed.

If the specified binding's queue set becomes empty, the binding
itself is removed from the exchange's binding list. If the queue's
last binding on this exchange is removed, the exchange is dropped
from the queue's exchange-bindings index.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### binding?

`string`

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### cb

`ICallback`

##### Returns

`void`

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `binding`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

###### binding

`string`

###### cb

`ICallback`

##### Returns

`void`
