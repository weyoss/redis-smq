[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IProducer

# Interface: IProducer

Publishes messages to queues or exchanges.

A Producer wraps the routing and publishing machinery: it resolves a
message's destination (either a queue, or the set of queues that
match an exchange and routing key), dispatches a copy of the message
to each, and returns the resulting message IDs.

The producer is stateful — it owns a Redis connection and a
`PubSubTargetResolver` cache that tracks PUB/SUB queues and their
consumer groups. `run()` must be called before `produce()`; publishing
without a running producer raises `ProducerNotRunningError`.

The resolver is a required part of the producer, not an optional
helper. If the resolver goes down at runtime (for example, after an
unhandled error inside it), the producer shuts itself down. A caller
that wants to continue producing creates a new producer instance and
calls `run()` again. This is a deliberate design choice: the resolver
is the producer's only source of truth for a queue's delivery model,
and the producer cannot route messages correctly without it.

Both the promise and callback forms are declared for `produce`,
matching the concrete class.

## Example

```ts
const producer = new Producer();
await producer.run();

// Direct to a queue
const msg = new ProducibleMessage()
  .setQueue({ name: 'orders', ns: 'default' })
  .setBody({ orderId: 123 });
const ids = await producer.produce(msg);

// Through a topic exchange
const exchangeMsg = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 456 });
const ids2 = await producer.produce(exchangeMsg);

await producer.shutdown();
```

## Extends

- `Runnable`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\>

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`Runnable.emit`

---

### ensureIsOperational()

#### Call Signature

> **ensureIsOperational**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`Runnable.ensureIsOperational`

#### Call Signature

> **ensureIsOperational**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`Runnable.ensureIsOperational`

---

### getId()

> **getId**(): `string`

#### Returns

`string`

#### Inherited from

`Runnable.getId`

---

### isDown()

> **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isDown`

---

### isGoingDown()

> **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isGoingDown`

---

### isGoingUp()

> **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isGoingUp`

---

### isOperational()

> **isOperational**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isOperational`

---

### isRunning()

> **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isRunning`

---

### isUp()

> **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`Runnable.isUp`

---

### listenerCount()

> **listenerCount**\<`E`\>(`event`): `number`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

#### Returns

`number`

#### Inherited from

`Runnable.listenerCount`

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.once`

---

### produce()

#### Call Signature

> **produce**(`msg`): `Promise`\<`string`[]\>

Publishes a message.

The message's destination determines the routing path:

- If a queue was set (via `setQueue`), the message is delivered
  to that queue directly. The returned array contains exactly one
  message ID.

- If an exchange was set (via `setDirectExchange`,
  `setTopicExchange`, or `setFanoutExchange`), the producer
  resolves the set of queues that the exchange and routing key
  match, then delivers a copy to each. The returned array contains
  one message ID per destination queue.

- If a queue is PUB/SUB, each matching consumer group receives its
  own copy of the message (with its own message ID). The returned
  array contains one ID per consumer group.

The returned IDs are the IDs of the messages as they were enqueued.
A single `produce()` call can return multiple IDs — one per
destination queue, multiplied by the number of consumer groups for
PUB/SUB destinations.

Failures:

- `ProducerNotRunningError` — `run()` was never called, or the
  producer has since shut down.
- `MessageExchangeRequiredError` — the message has neither a
  queue nor an exchange.
- `RoutingKeyRequiredError` — the message targets a direct or
  topic exchange without a routing key.
- `ExchangeNotFoundError` — the message targets an exchange that
  does not exist. Raised before routing is attempted, so the
  error is uniform across the three exchange types.
- `NoMatchingQueuesError` — the exchange exists but resolved to
  zero destination queues. Distinct from `ExchangeNotFoundError`:
  this is a valid exchange with no listeners, not a missing
  exchange.
- `QueueHasNoConsumerGroupsError` — the message targets a PUB/SUB
  queue that has no consumer groups.
- `PanicError` — the resolver is not operational, or an internal
  invariant was violated.

On a partial failure (some destinations succeeded, some failed), the
call rejects with the first error encountered. Messages already
dispatched remain published; the caller cannot roll back a partial
fan-out. Designers who need all-or-nothing behavior across multiple
destinations should structure their workflow so each destination's
publish is independent.

##### Parameters

###### msg

[`IProducibleMessage`](IProducibleMessage.md)

##### Returns

`Promise`\<`string`[]\>

##### Example

```ts
// Promise
const ids = await producer.produce(msg);
console.log(`Produced ${ids.length} message(s)`);

// Callback
producer.produce(msg, (err, ids) => {
  if (err) throw err;
  console.log(ids);
});
```

#### Call Signature

> **produce**(`msg`, `cb`): `void`

##### Parameters

###### msg

[`IProducibleMessage`](IProducibleMessage.md)

###### cb

`ICallback`\<`string`[]\>

##### Returns

`void`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

`Runnable.removeAllListeners`

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TProducerEvent`](../type-aliases/TProducerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TProducerEvent`](../type-aliases/TProducerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.removeListener`

---

### run()

#### Call Signature

> **run**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`Runnable.run`

#### Call Signature

> **run**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`Runnable.run`

---

### shutdown()

#### Call Signature

> **shutdown**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`Runnable.shutdown`

#### Call Signature

> **shutdown**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`Runnable.shutdown`
