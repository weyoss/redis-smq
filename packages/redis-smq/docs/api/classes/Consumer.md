[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

Consumer for processing messages from queues.

Manages message handlers, heartbeats, and consumption lifecycle.
Supports multiplexing for multiple queues and batch acknowledgments.

## Example

```ts
const consumer = new Consumer();
await consumer.run();

// Callback-style handler
await consumer.consume('orders', (message, done) => {
  console.log(message.getBody());
  done();
});

// Promise-style handler
await consumer.consume('orders', async (message) => {
  await processMessage(message);
});
```

## Extends

- `Runnable`\<[`TConsumerEvent`](../type-aliases/TConsumerEvent.md)\>

## Constructors

### Constructor

> **new Consumer**(`consumerOptions?`): `Consumer`

#### Parameters

##### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

#### Returns

`Consumer`

#### Overrides

`Runnable<TConsumerEvent>.constructor`

## Methods

### cancel()

#### Call Signature

> **cancel**(`queue`): `Promise`\<`void`\>

Stops message consumption from a queue.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { name, ns, groupId }

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await consumer.cancel('orders');

// Callback
consumer.cancel('orders', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **cancel**(`queue`, `cb`): `void`

Stops message consumption from a queue.

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue name (string) or { name, ns } or { name, ns, groupId }

###### cb

`ICallback`\<`void`\>

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await consumer.cancel('orders');

// Callback
consumer.cancel('orders', (err) => {
  if (err) throw err;
});
```

---

### consume()

#### Call Signature

> **consume**(`queue`, `messageHandler`): `Promise`\<`void`\>

Registers a message handler for a queue.

The handler can be either:

- A callback function: `(message, done) => void`
- A promise function: `async (message) => Promise<void>`
- A string path to a module exporting a handler

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue identifier: string name, IQueueParams, or IQueueParsedParams

###### messageHandler

[`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

Handler function or module path

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Callback handler
await consumer.consume('orders', (message, done) => {
  console.log(message.getBody());
  done();
});

// Promise handler
await consumer.consume('orders', async (message) => {
  await processMessage(message);
});

// Module path handler
await consumer.consume('orders', './handlers/order-handler.js');

// Callback
consumer.consume(
  'orders',
  (message, done) => {
    done();
  },
  (err) => {
    if (err) throw err;
  },
);
```

#### Call Signature

> **consume**(`queue`, `messageHandler`, `cb`): `void`

Registers a message handler for a queue.

The handler can be either:

- A callback function: `(message, done) => void`
- A promise function: `async (message) => Promise<void>`
- A string path to a module exporting a handler

##### Parameters

###### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Queue identifier: string name, IQueueParams, or IQueueParsedParams

###### messageHandler

[`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

Handler function or module path

###### cb

`ICallback`\<`void`\>

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Callback handler
await consumer.consume('orders', (message, done) => {
  console.log(message.getBody());
  done();
});

// Promise handler
await consumer.consume('orders', async (message) => {
  await processMessage(message);
});

// Module path handler
await consumer.consume('orders', './handlers/order-handler.js');

// Callback
consumer.consume(
  'orders',
  (message, done) => {
    done();
  },
  (err) => {
    if (err) throw err;
  },
);
```

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

> **getQueues**(): [`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

Gets all queues the consumer is handling.

#### Returns

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

Array of queue parameters

#### Example

```ts
const queues = consumer.getQueues();
console.log(queues);
```

---

### getQueuesWithStatus()

> **getQueuesWithStatus**(): [`IConsumerQueuesWithStatus`](../interfaces/IConsumerQueuesWithStatus.md)[]

Gets all queues with their consumption status.

#### Returns

[`IConsumerQueuesWithStatus`](../interfaces/IConsumerQueuesWithStatus.md)[]

Array of queue objects with status ('active' or 'stopped')

#### Example

```ts
const queues = consumer.getQueuesWithStatus();
console.log(queues[0].status);
```

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

---

### getDefaultOptions()

> `static` **getDefaultOptions**(): [`IConsumerParsedOptions`](../interfaces/IConsumerParsedOptions.md)

Gets current default options for Consumer instances.

#### Returns

[`IConsumerParsedOptions`](../interfaces/IConsumerParsedOptions.md)

Copy of default options

#### Example

```ts
const defaults = Consumer.getDefaultOptions();
console.log(defaults);
```

---

### setDefaultOptions()

> `static` **setDefaultOptions**(`options`): `void`

Sets default options for all future Consumer instances.

#### Parameters

##### options

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Default consumer options

#### Returns

`void`

#### Example

```ts
Consumer.setDefaultOptions({
  enableMultiplexing: true,
  heartbeatTTL: 60000,
});
```
