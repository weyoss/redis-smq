[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

Topic exchange for pattern-based message routing.

Routes messages to queues based on pattern matching between routing keys
and binding patterns using AMQP-style wildcards:

- '\*' matches exactly one token
- '#' matches zero or more tokens
- Tokens are separated by dots (.)

## Example

```ts
const topicExchange = new ExchangeTopic();

// Bind a queue with pattern
await topicExchange.bindQueue('order-processor', 'events', 'order.#');

// Match queues for a routing key
const queues = await topicExchange.matchQueues('events', 'order.created');
```

## Constructors

### Constructor

> **new ExchangeTopic**(): `ExchangeTopic`

#### Returns

`ExchangeTopic`

## Methods

### bindQueue()

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingPattern`): `Promise`\<`void`\>

Binds a queue to a topic exchange with a binding pattern.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Binding pattern (e.g., 'order.#', 'user.\*.created')

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await topicExchange.bindQueue('order-processor', 'events', 'order.#');

// Callback
topicExchange.bindQueue('order-processor', 'events', 'order.#', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **bindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

Binds a queue to a topic exchange with a binding pattern.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Binding pattern (e.g., 'order.#', 'user.\*.created')

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await topicExchange.bindQueue('order-processor', 'events', 'order.#');

// Callback
topicExchange.bindQueue('order-processor', 'events', 'order.#', (err) => {
  if (err) throw err;
});
```

---

### create()

#### Call Signature

> **create**(`exchange`, `queuePolicy`): `Promise`\<`void`\>

Creates a topic exchange.

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
await topicExchange.create('events', EExchangeQueuePolicy.STANDARD);

// Callback
topicExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **create**(`exchange`, `queuePolicy`, `cb`): `void`

Creates a topic exchange.

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
await topicExchange.create('events', EExchangeQueuePolicy.STANDARD);

// Callback
topicExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
  if (err) throw err;
});
```

---

### delete()

#### Call Signature

> **delete**(`exchange`): `Promise`\<`void`\>

Deletes a topic exchange.

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
await topicExchange.delete('events');

// Callback
topicExchange.delete('events', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **delete**(`exchange`, `cb`): `void`

Deletes a topic exchange.

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
await topicExchange.delete('events');

// Callback
topicExchange.delete('events', (err) => {
  if (err) throw err;
});
```

---

### getBindings()

#### Call Signature

> **getBindings**(`exchange`): `Promise`\<`Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>\>

Gets all bindings for a topic exchange.

Returns a mapping of routing patterns to the queues bound to them.

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
const bindings = await topicExchange.getBindings('events');
for (const [pattern, queues] of Object.entries(bindings)) {
  console.log(`${pattern}: ${queues.length} queues`);
}

// Callback
topicExchange.getBindings('events', (err, bindings) => {
  if (err) throw err;
  console.log(bindings);
});
```

#### Call Signature

> **getBindings**(`exchange`, `cb`): `void`

Gets all bindings for a topic exchange.

Returns a mapping of routing patterns to the queues bound to them.

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
const bindings = await topicExchange.getBindings('events');
for (const [pattern, queues] of Object.entries(bindings)) {
  console.log(`${pattern}: ${queues.length} queues`);
}

// Callback
topicExchange.getBindings('events', (err, bindings) => {
  if (err) throw err;
  console.log(bindings);
});
```

---

### getRoutingPatternBoundQueues()

#### Call Signature

> **getRoutingPatternBoundQueues**(`exchange`, `bindingPattern`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Gets all queues bound to a specific routing pattern.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### bindingPattern

`string`

Binding pattern (e.g., 'order.#')

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await topicExchange.getRoutingPatternBoundQueues(
  'events',
  'order.#',
);

// Callback
topicExchange.getRoutingPatternBoundQueues(
  'events',
  'order.#',
  (err, queues) => {
    if (err) throw err;
    console.log(queues);
  },
);
```

#### Call Signature

> **getRoutingPatternBoundQueues**(`exchange`, `bindingPattern`, `cb`): `void`

Gets all queues bound to a specific routing pattern.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### bindingPattern

`string`

Binding pattern (e.g., 'order.#')

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await topicExchange.getRoutingPatternBoundQueues(
  'events',
  'order.#',
);

// Callback
topicExchange.getRoutingPatternBoundQueues(
  'events',
  'order.#',
  (err, queues) => {
    if (err) throw err;
    console.log(queues);
  },
);
```

---

### getRoutingPatterns()

#### Call Signature

> **getRoutingPatterns**(`exchange`): `Promise`\<`string`[]\>

Gets all routing patterns registered for a topic exchange.

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
const patterns = await topicExchange.getRoutingPatterns('events');

// Callback
topicExchange.getRoutingPatterns('events', (err, patterns) => {
  if (err) throw err;
  console.log(patterns);
});
```

#### Call Signature

> **getRoutingPatterns**(`exchange`, `cb`): `void`

Gets all routing patterns registered for a topic exchange.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### cb

`ICallback`\<`string`[]\>

(err, patterns) => void. Returns string[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const patterns = await topicExchange.getRoutingPatterns('events');

// Callback
topicExchange.getRoutingPatterns('events', (err, patterns) => {
  if (err) throw err;
  console.log(patterns);
});
```

---

### matchQueues()

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Matches queues for a routing key based on binding patterns.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to match (e.g., 'order.created')

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await topicExchange.matchQueues('events', 'order.created');

// Callback
topicExchange.matchQueues('events', 'order.created', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **matchQueues**(`exchange`, `routingKey`, `cb`): `void`

Matches queues for a routing key based on binding patterns.

##### Parameters

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingKey

`string`

Routing key to match (e.g., 'order.created')

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

(err, queues) => void. Returns IQueueParams[]

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const queues = await topicExchange.matchQueues('events', 'order.created');

// Callback
topicExchange.matchQueues('events', 'order.created', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

---

### unbindQueue()

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingPattern`): `Promise`\<`void`\>

Unbinds a queue from a topic exchange binding pattern.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Binding pattern to unbind

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await topicExchange.unbindQueue('order-processor', 'events', 'order.cancelled');

// Callback
topicExchange.unbindQueue(
  'order-processor',
  'events',
  'order.cancelled',
  (err) => {
    if (err) throw err;
  },
);
```

#### Call Signature

> **unbindQueue**(`queue`, `exchange`, `routingPattern`, `cb`): `void`

Unbinds a queue from a topic exchange binding pattern.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### exchange

Exchange name (string) or { name, ns }

`string` | [`IExchangeParams`](../interfaces/IExchangeParams.md)

###### routingPattern

`string`

Binding pattern to unbind

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await topicExchange.unbindQueue('order-processor', 'events', 'order.cancelled');

// Callback
topicExchange.unbindQueue(
  'order-processor',
  'events',
  'order.cancelled',
  (err) => {
    if (err) throw err;
  },
);
```
