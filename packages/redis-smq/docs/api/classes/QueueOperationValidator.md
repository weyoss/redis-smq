[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueOperationValidator

# Class: QueueOperationValidator

Validates allowed operations on queues based on their state.

Queue states and allowed operations:

- ACTIVE: All operations
- PAUSED: All operations except CONSUME
- STOPPED: Only management operations (purge, delete, rate limits, consumer groups, exchanges)
- LOCKED: No operations allowed

## Example

```ts
const canConsume = await QueueOperationValidator.canConsume('orders');
if (canConsume) {
  await consumer.consume('orders', handler);
}
```

## Constructors

### Constructor

> **new QueueOperationValidator**(): `QueueOperationValidator`

#### Returns

`QueueOperationValidator`

## Methods

### canBindExchange()

#### Call Signature

> `static` **canBindExchange**(`queue`): `Promise`\<`boolean`\>

Checks if an exchange can be bound to the queue.

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
const canBind = await QueueOperationValidator.canBindExchange('orders');

// Callback
QueueOperationValidator.canBindExchange('orders', (err, canBind) => {
  if (err) throw err;
  console.log(canBind);
});
```

#### Call Signature

> `static` **canBindExchange**(`queue`, `cb`): `void`

Checks if an exchange can be bound to the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canBindExchange) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canBind = await QueueOperationValidator.canBindExchange('orders');

// Callback
QueueOperationValidator.canBindExchange('orders', (err, canBind) => {
  if (err) throw err;
  console.log(canBind);
});
```

---

### canClearRateLimit()

#### Call Signature

> `static` **canClearRateLimit**(`queue`): `Promise`\<`boolean`\>

Checks if the rate limit can be cleared from the queue.

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
const canClear = await QueueOperationValidator.canClearRateLimit('orders');

// Callback
QueueOperationValidator.canClearRateLimit('orders', (err, canClear) => {
  if (err) throw err;
  console.log(canClear);
});
```

#### Call Signature

> `static` **canClearRateLimit**(`queue`, `cb`): `void`

Checks if the rate limit can be cleared from the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canClearRateLimit) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canClear = await QueueOperationValidator.canClearRateLimit('orders');

// Callback
QueueOperationValidator.canClearRateLimit('orders', (err, canClear) => {
  if (err) throw err;
  console.log(canClear);
});
```

---

### canConsume()

#### Call Signature

> `static` **canConsume**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be consumed from the queue.

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
const canConsume = await QueueOperationValidator.canConsume('orders');

// Callback
QueueOperationValidator.canConsume('orders', (err, canConsume) => {
  if (err) throw err;
  console.log(canConsume);
});
```

#### Call Signature

> `static` **canConsume**(`queue`, `cb`): `void`

Checks if messages can be consumed from the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canConsume) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canConsume = await QueueOperationValidator.canConsume('orders');

// Callback
QueueOperationValidator.canConsume('orders', (err, canConsume) => {
  if (err) throw err;
  console.log(canConsume);
});
```

---

### canCreateConsumerGroup()

#### Call Signature

> `static` **canCreateConsumerGroup**(`queue`): `Promise`\<`boolean`\>

Checks if a consumer group can be created for the queue.

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
const canCreate =
  await QueueOperationValidator.canCreateConsumerGroup('orders');

// Callback
QueueOperationValidator.canCreateConsumerGroup('orders', (err, canCreate) => {
  if (err) throw err;
  console.log(canCreate);
});
```

#### Call Signature

> `static` **canCreateConsumerGroup**(`queue`, `cb`): `void`

Checks if a consumer group can be created for the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canCreateConsumerGroup) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canCreate =
  await QueueOperationValidator.canCreateConsumerGroup('orders');

// Callback
QueueOperationValidator.canCreateConsumerGroup('orders', (err, canCreate) => {
  if (err) throw err;
  console.log(canCreate);
});
```

---

### canDelete()

#### Call Signature

> `static` **canDelete**(`queue`): `Promise`\<`boolean`\>

Checks if the queue can be deleted.

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
const canDelete = await QueueOperationValidator.canDelete('orders');

// Callback
QueueOperationValidator.canDelete('orders', (err, canDelete) => {
  if (err) throw err;
  console.log(canDelete);
});
```

#### Call Signature

> `static` **canDelete**(`queue`, `cb`): `void`

Checks if the queue can be deleted.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canDelete) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canDelete = await QueueOperationValidator.canDelete('orders');

// Callback
QueueOperationValidator.canDelete('orders', (err, canDelete) => {
  if (err) throw err;
  console.log(canDelete);
});
```

---

### canDeleteConsumerGroup()

#### Call Signature

> `static` **canDeleteConsumerGroup**(`queue`): `Promise`\<`boolean`\>

Checks if a consumer group can be deleted from the queue.

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
const canDelete =
  await QueueOperationValidator.canDeleteConsumerGroup('orders');

// Callback
QueueOperationValidator.canDeleteConsumerGroup('orders', (err, canDelete) => {
  if (err) throw err;
  console.log(canDelete);
});
```

#### Call Signature

> `static` **canDeleteConsumerGroup**(`queue`, `cb`): `void`

Checks if a consumer group can be deleted from the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canDeleteConsumerGroup) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canDelete =
  await QueueOperationValidator.canDeleteConsumerGroup('orders');

// Callback
QueueOperationValidator.canDeleteConsumerGroup('orders', (err, canDelete) => {
  if (err) throw err;
  console.log(canDelete);
});
```

---

### canDeleteMessage()

#### Call Signature

> `static` **canDeleteMessage**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be deleted from the queue.

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
const canDelete = await QueueOperationValidator.canDeleteMessage('orders');

// Callback
QueueOperationValidator.canDeleteMessage('orders', (err, canDelete) => {
  if (err) throw err;
  console.log(canDelete);
});
```

#### Call Signature

> `static` **canDeleteMessage**(`queue`, `cb`): `void`

Checks if messages can be deleted from the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canDeleteMessage) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canDelete = await QueueOperationValidator.canDeleteMessage('orders');

// Callback
QueueOperationValidator.canDeleteMessage('orders', (err, canDelete) => {
  if (err) throw err;
  console.log(canDelete);
});
```

---

### canProduce()

#### Call Signature

> `static` **canProduce**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be produced to the queue.

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
const canProduce = await QueueOperationValidator.canProduce('orders');

// Callback
QueueOperationValidator.canProduce('orders', (err, canProduce) => {
  if (err) throw err;
  console.log(canProduce);
});
```

#### Call Signature

> `static` **canProduce**(`queue`, `cb`): `void`

Checks if messages can be produced to the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canProduce) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canProduce = await QueueOperationValidator.canProduce('orders');

// Callback
QueueOperationValidator.canProduce('orders', (err, canProduce) => {
  if (err) throw err;
  console.log(canProduce);
});
```

---

### canPurge()

#### Call Signature

> `static` **canPurge**(`queue`): `Promise`\<`boolean`\>

Checks if the queue can be purged (all messages removed).

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
const canPurge = await QueueOperationValidator.canPurge('orders');

// Callback
QueueOperationValidator.canPurge('orders', (err, canPurge) => {
  if (err) throw err;
  console.log(canPurge);
});
```

#### Call Signature

> `static` **canPurge**(`queue`, `cb`): `void`

Checks if the queue can be purged (all messages removed).

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canPurge) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canPurge = await QueueOperationValidator.canPurge('orders');

// Callback
QueueOperationValidator.canPurge('orders', (err, canPurge) => {
  if (err) throw err;
  console.log(canPurge);
});
```

---

### canRequeue()

#### Call Signature

> `static` **canRequeue**(`queue`): `Promise`\<`boolean`\>

Checks if messages can be requeued for reprocessing.

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
const canRequeue = await QueueOperationValidator.canRequeue('orders');

// Callback
QueueOperationValidator.canRequeue('orders', (err, canRequeue) => {
  if (err) throw err;
  console.log(canRequeue);
});
```

#### Call Signature

> `static` **canRequeue**(`queue`, `cb`): `void`

Checks if messages can be requeued for reprocessing.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canRequeue) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canRequeue = await QueueOperationValidator.canRequeue('orders');

// Callback
QueueOperationValidator.canRequeue('orders', (err, canRequeue) => {
  if (err) throw err;
  console.log(canRequeue);
});
```

---

### canSetRateLimit()

#### Call Signature

> `static` **canSetRateLimit**(`queue`): `Promise`\<`boolean`\>

Checks if a rate limit can be set on the queue.

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
const canSet = await QueueOperationValidator.canSetRateLimit('orders');

// Callback
QueueOperationValidator.canSetRateLimit('orders', (err, canSet) => {
  if (err) throw err;
  console.log(canSet);
});
```

#### Call Signature

> `static` **canSetRateLimit**(`queue`, `cb`): `void`

Checks if a rate limit can be set on the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canSetRateLimit) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canSet = await QueueOperationValidator.canSetRateLimit('orders');

// Callback
QueueOperationValidator.canSetRateLimit('orders', (err, canSet) => {
  if (err) throw err;
  console.log(canSet);
});
```

---

### canUnbindExchange()

#### Call Signature

> `static` **canUnbindExchange**(`queue`): `Promise`\<`boolean`\>

Checks if an exchange can be unbound from the queue.

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
const canUnbind = await QueueOperationValidator.canUnbindExchange('orders');

// Callback
QueueOperationValidator.canUnbindExchange('orders', (err, canUnbind) => {
  if (err) throw err;
  console.log(canUnbind);
});
```

#### Call Signature

> `static` **canUnbindExchange**(`queue`, `cb`): `void`

Checks if an exchange can be unbound from the queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

(err, canUnbindExchange) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const canUnbind = await QueueOperationValidator.canUnbindExchange('orders');

// Callback
QueueOperationValidator.canUnbindExchange('orders', (err, canUnbind) => {
  if (err) throw err;
  console.log(canUnbind);
});
```
