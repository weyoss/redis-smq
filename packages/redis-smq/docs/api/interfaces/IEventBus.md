[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IEventBus

# Interface: IEventBus

The user-facing distributed event bus.

RedisSMQ publishes lifecycle and message-outcome events through this
bus. The bus is distributed: an event emitted by one process is
delivered to every subscriber across all processes, provided the
subscriber's own bus is running (see below).

Two buses exist in the library:

- The user bus (this interface). Public events that applications
  subscribe to: queue lifecycle, message outcomes, producer and
  consumer state changes.

- The internal bus. Coordination events between library components
  — configuration sync, cross-process queue state notifications.
  Applications never subscribe to these. The internal bus is not
  part of the public API.

Some events are published on both buses via the event multiplexer.
`queue.queueCreated` and `queue.stateChanged`, for example, are
published internally for coordination and publicly for observability.
A caller subscribing to the public bus sees them once; the internal
bus's copy is consumed by the library.

Lifecycle:

The bus is created lazily on first access, but it is **not started
automatically**. A caller who wants to receive public events must
call `run()` on the instance returned by `RedisSMQ.getEventBus()`.
Until `run()` has completed, every publish targeted at the user bus
is silently dropped — the multiplexer's publish guard consults
`isRunning()` before emitting, and neither the bus nor Redis
buffers events for a subscriber that has not yet connected. There
is no replay: events emitted before `run()` completes are lost.

`RedisSMQ.shutdown()` stops the bus if it was started, alongside the
rest of the library's resources. If the bus was never started, the
shutdown is a no-op. Both `run()` and `shutdown()` are exposed
because the concrete class implements `Runnable`; in normal use the
caller starts the bus and the library stops it.

## Example

```ts
import { RedisSMQ } from 'redis-smq';

// Start the bus before subscribing. Subscriptions added before
// run() completes are attached, but no event is delivered until
// run() resolves.
const eventBus = RedisSMQ.getEventBus();
await eventBus.run();

eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => {
  console.log(`Message ${messageId} acknowledged by ${consumerId}`);
});

eventBus.on('queue.queueCreated', (queue, properties) => {
  console.log(`Queue ${queue.name}@${queue.ns} created`);
});

// RedisSMQ.shutdown() stops the bus along with the rest of the
// library; the caller does not normally call eventBus.shutdown()
// directly.
```

## Extends

- `EventBus`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ `"configuration.updated"` \| keyof TConsumerEvent \| keyof TProducerEvent \| keyof TQueueEvent

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`EventBus.emit`

---

### ensureIsOperational()

#### Call Signature

> **ensureIsOperational**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`EventBus.ensureIsOperational`

#### Call Signature

> **ensureIsOperational**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`EventBus.ensureIsOperational`

---

### getId()

> **getId**(): `string`

#### Returns

`string`

#### Inherited from

`EventBus.getId`

---

### isDown()

> **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`EventBus.isDown`

---

### isGoingDown()

> **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`EventBus.isGoingDown`

---

### isGoingUp()

> **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`EventBus.isGoingUp`

---

### isOperational()

> **isOperational**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`EventBus.isOperational`

---

### isRunning()

> **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`EventBus.isRunning`

---

### isUp()

> **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`EventBus.isUp`

---

### listenerCount()

> **listenerCount**\<`E`\>(`event`): `number`

#### Type Parameters

##### E

`E` _extends_ `"configuration.updated"` \| keyof TConsumerEvent \| keyof TProducerEvent \| keyof TQueueEvent

#### Parameters

##### event

`E`

#### Returns

`number`

#### Inherited from

`EventBus.listenerCount`

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `"configuration.updated"` \| keyof TConsumerEvent \| keyof TProducerEvent \| keyof TQueueEvent

#### Parameters

##### event

`E`

##### listener

[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`EventBus.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `"configuration.updated"` \| keyof TConsumerEvent \| keyof TProducerEvent \| keyof TQueueEvent

#### Parameters

##### event

`E`

##### listener

[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`EventBus.once`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ `"configuration.updated"` \| keyof TConsumerEvent \| keyof TProducerEvent \| keyof TQueueEvent

#### Parameters

##### event?

`E`

#### Returns

`this`

#### Inherited from

`EventBus.removeAllListeners`

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `"configuration.updated"` \| keyof TConsumerEvent \| keyof TProducerEvent \| keyof TQueueEvent

#### Parameters

##### event

`E`

##### listener

[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`EventBus.removeListener`

---

### run()

#### Call Signature

> **run**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`EventBus.run`

#### Call Signature

> **run**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`EventBus.run`

---

### shutdown()

#### Call Signature

> **shutdown**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

##### Inherited from

`EventBus.shutdown`

#### Call Signature

> **shutdown**(`cb`): `void`

##### Parameters

###### cb

`ICallback`

##### Returns

`void`

##### Inherited from

`EventBus.shutdown`
