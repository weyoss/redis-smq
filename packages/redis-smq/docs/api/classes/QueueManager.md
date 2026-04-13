[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueManager

# Class: QueueManager

Manages queue lifecycle and metadata operations.

Provides methods to create, delete, check existence, and retrieve
queue properties, consumers, and consumer IDs.

## Example

```ts
const queueManager = new QueueManager();

// Create a queue
const { queue, properties } = await queueManager.save(
  'orders',
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
);

// Get all queues
const queues = await queueManager.getQueues();
```

## Constructors

### Constructor

> **new QueueManager**(): `QueueManager`

#### Returns

`QueueManager`

## Methods

### delete()

#### Call Signature

> **delete**(`queue`): `Promise`\<`void`\>

Deletes a queue and all its data.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await queueManager.delete('old-queue');

// Callback
queueManager.delete('old-queue', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **delete**(`queue`, `cb`): `void`

Deletes a queue and all its data.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await queueManager.delete('old-queue');

// Callback
queueManager.delete('old-queue', (err) => {
  if (err) throw err;
});
```

---

### exists()

#### Call Signature

> **exists**(`queue`): `Promise`\<`boolean`\>

Checks if a queue exists.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exists = await queueManager.exists('orders');

// Callback
queueManager.exists('orders', (err, exists) => {
  if (err) throw err;
  console.log(exists);
});
```

#### Call Signature

> **exists**(`queue`, `cb`): `void`

Checks if a queue exists.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, exists) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const exists = await queueManager.exists('orders');

// Callback
queueManager.exists('orders', (err, exists) => {
  if (err) throw err;
  console.log(exists);
});
```

---

### getConsumerIds()

#### Call Signature

> **getConsumerIds**(`queue`): `Promise`\<`string`[]\>

Gets consumer IDs for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`string`[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const ids = await queueManager.getConsumerIds('orders');
console.log(ids);

// Callback
queueManager.getConsumerIds('orders', (err, ids) => {
  if (err) throw err;
  console.log(ids);
});
```

#### Call Signature

> **getConsumerIds**(`queue`, `cb`): `void`

Gets consumer IDs for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`string`[]\>

(err, consumerIds) => void. Returns string[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const ids = await queueManager.getConsumerIds('orders');
console.log(ids);

// Callback
queueManager.getConsumerIds('orders', (err, ids) => {
  if (err) throw err;
  console.log(ids);
});
```

---

### getConsumers()

#### Call Signature

> **getConsumers**(`queue`): `Promise`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

Gets active consumers for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const consumers = await queueManager.getConsumers('orders');
console.log(Object.keys(consumers).length);

// Callback
queueManager.getConsumers('orders', (err, consumers) => {
  if (err) throw err;
  console.log(consumers);
});
```

#### Call Signature

> **getConsumers**(`queue`, `cb`): `void`

Gets active consumers for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

(err, consumers) => void. Returns Record<string, TQueueConsumer>

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const consumers = await queueManager.getConsumers('orders');
console.log(Object.keys(consumers).length);

// Callback
queueManager.getConsumers('orders', (err, consumers) => {
  if (err) throw err;
  console.log(consumers);
});
```

---

### getProperties()

#### Call Signature

> **getProperties**(`queue`): `Promise`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

Gets queue properties including counts and state.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const props = await queueManager.getProperties('orders');
console.log(props.pendingMessagesCount);

// Callback
queueManager.getProperties('orders', (err, props) => {
  if (err) throw err;
  console.log(props);
});
```

#### Call Signature

> **getProperties**(`queue`, `cb`): `void`

Gets queue properties including counts and state.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

(err, properties) => void. Returns IQueueProperties

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const props = await queueManager.getProperties('orders');
console.log(props.pendingMessagesCount);

// Callback
queueManager.getProperties('orders', (err, props) => {
  if (err) throw err;
  console.log(props);
});
```

---

### getQueues()

#### Call Signature

> **getQueues**(): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Gets all queues across all namespaces.

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await queueManager.getQueues();
queues.forEach((q) => console.log(`${q.name}@${q.ns}`));

// Callback
queueManager.getQueues((err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **getQueues**(`cb`): `void`

Gets all queues across all namespaces.

##### Parameters

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await queueManager.getQueues();
queues.forEach((q) => console.log(`${q.name}@${q.ns}`));

// Callback
queueManager.getQueues((err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

---

### save()

#### Call Signature

> **save**(`queue`, `queueType`, `deliveryModel`): `Promise`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

Creates a new queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### queueType

[`EQueueType`](../enumerations/EQueueType.md)

FIFO, LIFO, or PRIORITY

###### deliveryModel

[`EQueueDeliveryModel`](../enumerations/EQueueDeliveryModel.md)

POINT_TO_POINT or PUB_SUB

##### Returns

`Promise`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await queueManager.save(
  'orders',
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
);

// Callback
queueManager.save(
  'orders',
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    if (err) throw err;
    console.log(result.queue);
  },
);
```

#### Call Signature

> **save**(`queue`, `queueType`, `deliveryModel`, `cb`): `void`

Creates a new queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### queueType

[`EQueueType`](../enumerations/EQueueType.md)

FIFO, LIFO, or PRIORITY

###### deliveryModel

[`EQueueDeliveryModel`](../enumerations/EQueueDeliveryModel.md)

POINT_TO_POINT or PUB_SUB

###### cb

`ICallback`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

(err, result) => void. Result contains { queue: IQueueParams; properties: IQueueProperties }

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const result = await queueManager.save(
  'orders',
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
);

// Callback
queueManager.save(
  'orders',
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    if (err) throw err;
    console.log(result.queue);
  },
);
```
