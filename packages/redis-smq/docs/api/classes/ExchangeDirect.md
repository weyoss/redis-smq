[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ExchangeDirect

# Class: ExchangeDirect

Direct exchange for exact routing key matching.

Routes messages to queues based on exact routing key matches.
Messages published with a specific routing key are delivered only to
queues bound to that exact routing key.

## Example

```ts
const directExchange = new ExchangeDirect();

// Bind a queue
await directExchange.bindQueue('order-processor', 'events', 'order.created');

// Match queues for a routing key
const queues = await directExchange.matchQueues('events', 'order.created');
```

## Constructors

### Constructor

> **new ExchangeDirect**(): `ExchangeDirect`

#### Returns

`ExchangeDirect`

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingKey`): `Promise`\<`void`\>

Binds a queue to a direct exchange with a routing key.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key for matching

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await directExchange.bindQueue('order-processor', 'events', 'order.created');

// Callback
directExchange.bindQueue(
  'order-processor',
  'events',
  'order.created',
  (err) => {
    if (err) throw err;
  },
);
```

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingKey`, `cb`): `void`

Binds a queue to a direct exchange with a routing key.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key for matching

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await directExchange.bindQueue('order-processor', 'events', 'order.created');

// Callback
directExchange.bindQueue(
  'order-processor',
  'events',
  'order.created',
  (err) => {
    if (err) throw err;
  },
);
```

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a direct exchange.

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
await directExchange.create('events', EExchangeQueuePolicy.STANDARD);

// Callback
directExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

Creates a direct exchange.

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
await directExchange.create('events', EExchangeQueuePolicy.STANDARD);

// Callback
directExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) throw err;
});
```

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Deletes a direct exchange.

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
await directExchange.delete('old-events');

// Callback
directExchange.delete('old-events', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

Deletes a direct exchange.

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
await directExchange.delete('old-events');

// Callback
directExchange.delete('old-events', (err) => {
  if (err) throw err;
});
```

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

Gets all bindings for a direct exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const bindings = await directExchange.getBindings('events');
for (const [key, queues] of Object.entries(bindings)) {
  console.log(`${key}: ${queues.length} queues`);
}

// Callback
directExchange.getBindings('events', (err, bindings) => {
  if (err) throw err;
  console.log(bindings);
});
```

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

Gets all bindings for a direct exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

(err, bindings) => void. Returns Record<string, IQueueParams[]>

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const bindings = await directExchange.getBindings('events');
for (const [key, queues] of Object.entries(bindings)) {
  console.log(`${key}: ${queues.length} queues`);
}

// Callback
directExchange.getBindings('events', (err, bindings) => {
  if (err) throw err;
  console.log(bindings);
});
```

---

### getRoutingKeyBoundQueues()

#### Call Signature

> **getRoutingKeyBoundQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Gets all queues bound to a specific routing key.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await directExchange.getRoutingKeyBoundQueues(
  'events',
  'order.created',
);

// Callback
directExchange.getRoutingKeyBoundQueues(
  'events',
  'order.created',
  (err, queues) => {
    if (err) throw err;
    console.log(queues);
  },
);
```

#### Call Signature

> **getRoutingKeyBoundQueues**(`exchange`, `routingKey`, `cb`): `void`

Gets all queues bound to a specific routing key.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await directExchange.getRoutingKeyBoundQueues(
  'events',
  'order.created',
);

// Callback
directExchange.getRoutingKeyBoundQueues(
  'events',
  'order.created',
  (err, queues) => {
    if (err) throw err;
    console.log(queues);
  },
);
```

---

### getRoutingKeys()

#### Call Signature

> **getRoutingKeys**(`exchange`): `Promise`\<`string`[]\>

Gets all routing keys bound to a direct exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

##### Returns

`Promise`\<`string`[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const keys = await directExchange.getRoutingKeys('events');

// Callback
directExchange.getRoutingKeys('events', (err, keys) => {
  if (err) throw err;
  console.log(keys);
});
```

#### Call Signature

> **getRoutingKeys**(`exchange`, `cb`): `void`

Gets all routing keys bound to a direct exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<`string`[]\>

(err, keys) => void. Returns string[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const keys = await directExchange.getRoutingKeys('events');

// Callback
directExchange.getRoutingKeys('events', (err, keys) => {
  if (err) throw err;
  console.log(keys);
});
```

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Matches queues for a routing key (for message production).

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await directExchange.matchQueues('events', 'order.created');

// Callback
directExchange.matchQueues('events', 'order.created', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

Matches queues for a routing key (for message production).

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await directExchange.matchQueues('events', 'order.created');

// Callback
directExchange.matchQueues('events', 'order.created', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingKey`): `Promise`\<`void`\>

Unbinds a queue from a direct exchange.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to unbind

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await directExchange.unbindQueue('order-processor', 'events', 'order.created');

// Callback
directExchange.unbindQueue(
  'order-processor',
  'events',
  'order.created',
  (err) => {
    if (err) throw err;
  },
);
```

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingKey`, `cb`): `void`

Unbinds a queue from a direct exchange.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to unbind

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await directExchange.unbindQueue('order-processor', 'events', 'order.created');

// Callback
directExchange.unbindQueue(
  'order-processor',
  'events',
  'order.created',
  (err) => {
    if (err) throw err;
  },
);
```
