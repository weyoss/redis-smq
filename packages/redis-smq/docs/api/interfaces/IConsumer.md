[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IConsumer

# Interface: IConsumer

Processes messages from one or more queues.

A Consumer owns a set of message handlers, one per queue (plus consumer
group for PUB/SUB queues). After `run()`, each handler is subscribed
and its dequeue loop is active. Handlers may be added before or after
`run()`; those added before are started when the consumer starts,
those added after start immediately if the consumer is running and the
queue is ACTIVE.

The contract expresses both the promise and callback forms of every
asynchronous method. The concrete `Consumer` class provides both; this
interface declares both so that callers programming against `IConsumer`
are not restricted to one style.

## Extends

- `Runnable`\<[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\>

## Methods

### cancel()

#### Call Signature

> **cancel**(`queue`): `Promise`\<`void`\>

Stops the message handler for a queue and removes its configuration.

If the handler is using an ephemeral consumer group (PUB/SUB queues
without an explicit group ID), the group is deleted after the
consumer is unsubscribed.

A call for a queue the consumer is not handling is a no-op.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### Returns

`Promise`\<`void`\>

#### Call Signature

> **cancel**(`queue`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### cb

`ICallback`\<`void`\>

##### Returns

`void`

---

### consume()

#### Call Signature

> **consume**(`queue`, `handler`): `Promise`\<`void`\>

Registers a message handler for a queue.

The handler can be:

- a callback function: `(msg, cb) => void`
- a promise function: `async (msg) => Promise<void>`
- a module path: a string ending in `.js` or `.cjs` pointing to a
  file that exports a handler function

The queue can be specified as a plain name, `{ name, ns }`, or a
fully-parsed `{ queueParams, groupId }`. For PUB/SUB queues, an
ephemeral group is generated if no `groupId` is provided.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### handler

[`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Promise
await consumer.consume('orders', async (msg) => {
  await processOrder(msg.getBody());
});

// Callback
consumer.consume('orders', (msg, cb) => {
  processOrder(msg.getBody()).then(() => cb(), cb);
});
```

#### Call Signature

> **consume**(`queue`, `handler`, `cb`): `void`

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

###### handler

[`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

###### cb

`ICallback`\<`void`\>

##### Returns

`void`

---

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]\>

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

### getQueues()

> **getQueues**(): [`IQueueParsedParams`](IQueueParsedParams.md)[]

Returns the queues this consumer is configured to handle, with their
effective consumer group ID (an ephemeral ID for PUB/SUB queues
without an explicit group).

#### Returns

[`IQueueParsedParams`](IQueueParsedParams.md)[]

---

### getQueuesWithStatus()

> **getQueuesWithStatus**(): [`IConsumerQueuesWithStatus`](IConsumerQueuesWithStatus.md)[]

Returns the queues this consumer is handling, each with a status of
`'active'` (a running handler instance exists) or `'stopped'` (the
configuration is present but no instance is running — for example,
because the queue is PAUSED or STOPPED).

#### Returns

[`IConsumerQueuesWithStatus`](IConsumerQueuesWithStatus.md)[]

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

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

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

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

`Runnable.once`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

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

`E` _extends_ keyof [`TConsumerEvent`](../type-aliases/TConsumerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\[`E`\]

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
