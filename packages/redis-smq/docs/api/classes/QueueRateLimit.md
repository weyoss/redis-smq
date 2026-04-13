[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueRateLimit

# Class: QueueRateLimit

Manages queue rate limiting.

Provides methods to set, get, check, and clear rate limits on queues.
Rate limiting controls the number of messages processed within a timeframe.

## Example

```typescript
const rateLimit = new QueueRateLimit();

// Set rate limit: 100 messages per minute
await rateLimit.set('orders', { limit: 100, interval: 60000 });

// Check if exceeded
const exceeded = await rateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60000,
});
```

## Constructors

### Constructor

> **new QueueRateLimit**(): `QueueRateLimit`

#### Returns

`QueueRateLimit`

## Methods

### clear()

#### Call Signature

> **clear**(`queue`): `Promise`\<`void`\>

Clears the rate limit for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```typescript
// Promise
await rateLimit.clear('orders');

// Callback
rateLimit.clear('orders', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **clear**(`queue`, `cb`): `void`

Clears the rate limit for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`void`\>

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```typescript
// Promise
await rateLimit.clear('orders');

// Callback
rateLimit.clear('orders', (err) => {
  if (err) throw err;
});
```

---

### get()

#### Call Signature

> **get**(`queue`): `Promise`\<[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) \| `null`\>

Gets the current rate limit for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) \| `null`\>

Promise if no callback, otherwise void

##### Example

```typescript
// Promise
const rateLimit = await rateLimit.get('orders');
if (rateLimit) {
  console.log(`${rateLimit.limit} per ${rateLimit.interval}ms`);
} else {
  console.log('No rate limit set');
}

// Callback
rateLimit.get('orders', (err, rateLimit) => {
  if (err) throw err;
  console.log(rateLimit);
});
```

#### Call Signature

> **get**(`queue`, `cb`): `void`

Gets the current rate limit for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) \| `null`\>

(err, rateLimit) => void. Returns IQueueRateLimit or null if not set

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```typescript
// Promise
const rateLimit = await rateLimit.get('orders');
if (rateLimit) {
  console.log(`${rateLimit.limit} per ${rateLimit.interval}ms`);
} else {
  console.log('No rate limit set');
}

// Callback
rateLimit.get('orders', (err, rateLimit) => {
  if (err) throw err;
  console.log(rateLimit);
});
```

---

### hasExceeded()

#### Call Signature

> **hasExceeded**(`queue`, `rateLimit`): `Promise`\<`boolean`\>

Checks if the rate limit has been exceeded for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

{ limit, interval } to check against

##### Returns

`Promise`\<`boolean`\>

Promise if no callback, otherwise void

##### Example

```typescript
// Promise
const exceeded = await rateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60000,
});
if (exceeded) {
  console.log('Rate limit exceeded');
}

// Callback
rateLimit.hasExceeded(
  'orders',
  { limit: 100, interval: 60000 },
  (err, exceeded) => {
    if (err) throw err;
    console.log(exceeded);
  },
);
```

#### Call Signature

> **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

Checks if the rate limit has been exceeded for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

{ limit, interval } to check against

###### cb

`ICallback`\<`boolean`\>

(err, exceeded) => void. Returns boolean

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```typescript
// Promise
const exceeded = await rateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60000,
});
if (exceeded) {
  console.log('Rate limit exceeded');
}

// Callback
rateLimit.hasExceeded(
  'orders',
  { limit: 100, interval: 60000 },
  (err, exceeded) => {
    if (err) throw err;
    console.log(exceeded);
  },
);
```

---

### set()

#### Call Signature

> **set**(`queue`, `rateLimit`): `Promise`\<`void`\>

Sets a rate limit for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

{ limit, interval } where interval is in milliseconds (min 1000)

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```typescript
// Promise - 100 messages per minute
await rateLimit.set('orders', { limit: 100, interval: 60000 });

// Promise - 10 messages per second
await rateLimit.set('orders', { limit: 10, interval: 1000 });

// Callback
rateLimit.set('orders', { limit: 100, interval: 60000 }, (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **set**(`queue`, `rateLimit`, `cb`): `void`

Sets a rate limit for a queue.

##### Parameters

###### queue

Queue name (string) or { name, ns }

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

{ limit, interval } where interval is in milliseconds (min 1000)

###### cb

`ICallback`\<`void`\>

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```typescript
// Promise - 100 messages per minute
await rateLimit.set('orders', { limit: 100, interval: 60000 });

// Promise - 10 messages per second
await rateLimit.set('orders', { limit: 10, interval: 1000 });

// Callback
rateLimit.set('orders', { limit: 100, interval: 60000 }, (err) => {
  if (err) throw err;
});
```
