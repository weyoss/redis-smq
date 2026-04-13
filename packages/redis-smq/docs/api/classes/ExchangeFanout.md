[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ExchangeFanout

# Class: ExchangeFanout

Fanout exchange for broadcasting messages to all bound queues.

Routes messages to all queues bound to the exchange, ignoring routing keys.
Ideal for pub/sub patterns where every consumer should receive the message.

## Example

```ts
const fanoutExchange = new ExchangeFanout();

// Bind a queue
await fanoutExchange.bindQueue('notifications', 'broadcast');

// Match all bound queues
const queues = await fanoutExchange.matchQueues('broadcast');
```

## Constructors

### Constructor

> **new ExchangeFanout**(): `ExchangeFanout`

#### Returns

`ExchangeFanout`

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`): `Promise`\<`void`\>

Binds a queue to a fanout exchange.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.bindQueue('notifications', 'broadcast');

// Callback
fanoutExchange.bindQueue('notifications', 'broadcast', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `cb`): `void`

Binds a queue to a fanout exchange.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.bindQueue('notifications', 'broadcast');

// Callback
fanoutExchange.bindQueue('notifications', 'broadcast', (err) => {
  if (err) throw err;
});
```

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a fanout exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

STANDARD or PRIORITY

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.create('broadcast', EExchangeQueuePolicy.STANDARD);

// Callback
fanoutExchange.create('broadcast', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

Creates a fanout exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### queuePolicy

[`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

STANDARD or PRIORITY

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.create('broadcast', EExchangeQueuePolicy.STANDARD);

// Callback
fanoutExchange.create('broadcast', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) throw err;
});
```

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Deletes a fanout exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.delete('old-broadcast');

// Callback
fanoutExchange.delete('old-broadcast', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

Deletes a fanout exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.delete('old-broadcast');

// Callback
fanoutExchange.delete('old-broadcast', (err) => {
  if (err) throw err;
});
```

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Gets all bound queues for a fanout exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await fanoutExchange.getBindings('broadcast');

// Callback
fanoutExchange.getBindings('broadcast', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

Gets all bound queues for a fanout exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await fanoutExchange.getBindings('broadcast');

// Callback
fanoutExchange.getBindings('broadcast', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Gets all queues bound to a fanout exchange (for message production).

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await fanoutExchange.matchQueues('broadcast');

// Callback
fanoutExchange.matchQueues('broadcast', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **matchQueues**(`exchange`, `cb`): `void`

Gets all queues bound to a fanout exchange (for message production).

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await fanoutExchange.matchQueues('broadcast');

// Callback
fanoutExchange.matchQueues('broadcast', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`): `Promise`\<`void`\>

Unbinds a queue from a fanout exchange.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.unbindQueue('notifications', 'broadcast');

// Callback
fanoutExchange.unbindQueue('notifications', 'broadcast', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `cb`): `void`

Unbinds a queue from a fanout exchange.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await fanoutExchange.unbindQueue('notifications', 'broadcast');

// Callback
fanoutExchange.unbindQueue('notifications', 'broadcast', (err) => {
  if (err) throw err;
});
```
