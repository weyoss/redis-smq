[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueRateLimitManager

# Interface: IQueueRateLimitManager

Manages the consumption rate limit of a queue.

A rate limit bounds the number of messages a queue's consumers may
dequeue per unit of time. It is enforced by an atomic Redis check
that runs before every dequeue attempt: if the limit is reached, the
consumer's dequeue attempt is a no-op and the message stays in the
pending list. The check decrements a counter that resets on a rolling
window, so the limit holds across every consumer subscribed to the
queue, not per consumer.

The rate limit applies only to the consumption path. Publishing into a
rate-limited queue is not bounded — messages accumulate in the pending
list until the rate limit permits their dequeue.

Setting, clearing, and querying a rate limit are all permitted while
the queue is ACTIVE or PAUSED. They are refused while the queue is
STOPPED or LOCKED:

- On a STOPPED queue, the check would never be consulted and the
  counter would drift, so the library refuses the write.
- On a LOCKED queue, the caller must supply the matching lock ID to
  prove ownership before modifying the queue's properties.

Both the promise and callback forms are declared for every
asynchronous method, matching the concrete class.

## Example

```ts
const rateLimit = new QueueRateLimit();

// 100 messages per minute
await rateLimit.set('orders', { limit: 100, interval: 60_000 });

// Check whether the limit has been reached
const exceeded = await rateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60_000,
});

// Remove the limit
await rateLimit.clear('orders');
```

## Methods

### clear()

#### Call Signature

> **clear**(`queue`): `Promise`\<`void`\>

Removes the rate limit from a queue.

After clearing, the queue's dequeue path is unbounded. The
rate-limit counter is deleted; a subsequent `set` starts a fresh
window.

A queue with no rate limit is unaffected — the call is a no-op and
does not raise an error. This makes clearing idempotent, which is
useful for cleanup scripts that cannot know whether a queue was
rate-limited.

Fails with `QueueNotFoundError` if the queue does not exist. Fails
with `QueueLockedError` if the queue is LOCKED and no matching lock
ID was supplied.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Promise
await rateLimit.clear('orders');

// Callback
rateLimit.clear('orders', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **clear**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`

##### Returns

`void`

---

### get()

#### Call Signature

> **get**(`queue`): `Promise`\<[`IQueueRateLimit`](IQueueRateLimit.md) \| `null`\>

Returns the queue's current rate limit, or `null` if none is set.

The returned object carries the limit and interval that were
supplied by the most recent `set` call. A queue that has never had
a rate limit set, or whose limit was cleared, returns `null`.

Fails with `QueueNotFoundError` if the queue does not exist.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

##### Returns

`Promise`\<[`IQueueRateLimit`](IQueueRateLimit.md) \| `null`\>

##### Example

```ts
// Promise
const limit = await rateLimit.get('orders');
if (limit) {
  console.log(`${limit.limit} per ${limit.interval}ms`);
} else {
  console.log('No rate limit set');
}

// Callback
rateLimit.get('orders', (err, limit) => {
  if (err) throw err;
  console.log(limit);
});
```

#### Call Signature

> **get**(`queue`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### cb

`ICallback`\<[`IQueueRateLimit`](IQueueRateLimit.md) \| `null`\>

##### Returns

`void`

---

### hasExceeded()

#### Call Signature

> **hasExceeded**(`queue`, `rateLimit`): `Promise`\<`boolean`\>

Checks whether the rate limit has been reached.

This method does not read the stored rate limit — it tests the
given `rateLimit` value against the queue's counter. Callers
typically pass the same value they stored via `set`, but a caller
can also probe a hypothetical limit by passing an arbitrary value.

The check is a read-only observation. It does not consume a slot
from the rate-limit window; only the dequeue path does that. A
caller can therefore poll this method without affecting the actual
rate.

Returns `true` if the counter for the current window has reached
the given limit, meaning further dequeue attempts would be no-ops.
Returns `false` if the queue is still under the limit.

The check consults the queue's live counter in Redis. The value
reflects the current state of the counter, which is decremented by
the dequeue path and reset when the window expires.

Fails with `QueueNotFoundError` if the queue does not exist.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](IQueueRateLimit.md)

##### Returns

`Promise`\<`boolean`\>

##### Example

```ts
// Promise
const exceeded = await rateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60_000,
});
if (exceeded) {
  console.log('Rate limit reached, backing off');
}

// Callback
rateLimit.hasExceeded(
  'orders',
  { limit: 100, interval: 60_000 },
  (err, exceeded) => {
    if (err) throw err;
    console.log(exceeded);
  },
);
```

#### Call Signature

> **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](IQueueRateLimit.md)

###### cb

`ICallback`\<`boolean`\>

##### Returns

`void`

---

### set()

#### Call Signature

> **set**(`queue`, `rateLimit`): `Promise`\<`void`\>

Sets a rate limit on a queue.

The limit applies to the consumption path only. It is stored on the
queue's properties hash, so subsequent dequeue attempts consult it
before claiming a message.

Validation:

- `limit` must be a positive integer. A non-positive value fails
  with `InvalidRateLimitValueError`.
- `interval` must be at least 1000 milliseconds. A smaller value
  fails with `InvalidRateLimitIntervalError`. The minimum exists
  because the underlying counter has a resolution of one
  millisecond, and a shorter window would be dominated by network
  latency rather than reflecting real rate behavior.

Calling `set` on a queue that already has a rate limit replaces the
existing limit. The rate-limit counter is not reset — an
in-progress window continues with the new limit applied to
subsequent decrements.

Fails with `QueueNotFoundError` if the queue does not exist. Fails
with `QueueLockedError` if the queue is LOCKED and no matching lock
ID was supplied.

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](IQueueRateLimit.md)

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Promise - 10 messages per second
await rateLimit.set('orders', { limit: 10, interval: 1000 });

// Callback - 1000 messages per minute
rateLimit.set('orders', { limit: 1000, interval: 60_000 }, (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **set**(`queue`, `rateLimit`, `cb`): `void`

##### Parameters

###### queue

`string` \| [`IQueueParams`](IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](IQueueRateLimit.md)

###### cb

`ICallback`

##### Returns

`void`
