[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueRateLimit

# Class: QueueRateLimit

The QueueRateLimit class provides functionality to manage rate limiting for
message queues. It allows to set, get, check, and clear rate limits on
specified queues. The rate limiting mechanism helps ensure fair usage of
resources by controlling the number of messages processed within a defined
timeframe.

Rate limiting is essential for:

- Preventing consumer overload
- Ensuring fair resource distribution
- Protecting downstream services
- Managing message throughput
- Implementing service level agreements (SLAs)

## Example

```typescript
const rateLimit = new QueueRateLimit();

// Using callback
rateLimit.set('my-queue', { limit: 100, interval: 60000 }, (err) => {
  if (err) {
    console.error('Failed to set rate limit:', err);
  } else {
    console.log('Rate limit set: 100 messages per minute');
  }
});

// Using promise
await rateLimit.set('my-queue', { limit: 100, interval: 60000 });
console.log('Rate limit set successfully');
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

Resets or clears the rate limit settings for a specific queue.

This method removes any existing rate limit configuration from the queue,
allowing unlimited message processing. After clearing, the queue will
no longer have any rate restrictions.

##### Parameters

###### queue

The name of the queue or an IQueueParams object representing the queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the queue is locked and no lock ID is provided.

##### Example

```typescript
// Callback pattern
rateLimit.clear('my-queue', (err) => {
  if (err) {
    console.error('Failed to clear rate limit:', err);
  } else {
    console.log('Rate limit cleared successfully');
  }
});

// Promise pattern
try {
  await rateLimit.clear('my-queue');
  console.log('Rate limit cleared successfully');
} catch (err) {
  console.error('Failed to clear rate limit:', err);
}
```

#### Call Signature

> **clear**(`queue`, `cb`): `void`

Resets or clears the rate limit settings for a specific queue.

This method removes any existing rate limit configuration from the queue,
allowing unlimited message processing. After clearing, the queue will
no longer have any rate restrictions.

##### Parameters

###### queue

The name of the queue or an IQueueParams object representing the queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`void`\>

Optional callback function which receives an error or undefined when complete. - On success: `cb(null)` - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves when cleared.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the queue is locked and no lock ID is provided.

##### Example

```typescript
// Callback pattern
rateLimit.clear('my-queue', (err) => {
  if (err) {
    console.error('Failed to clear rate limit:', err);
  } else {
    console.log('Rate limit cleared successfully');
  }
});

// Promise pattern
try {
  await rateLimit.clear('my-queue');
  console.log('Rate limit cleared successfully');
} catch (err) {
  console.error('Failed to clear rate limit:', err);
}
```

---

### get()

#### Call Signature

> **get**(`queue`): `Promise`\<[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) \| `null`\>

Retrieves the current rate limit parameters for a specific message queue.

This method returns the currently configured rate limit for the queue,
or null if no rate limit is set.

##### Parameters

###### queue

The name of the queue or an IQueueParams object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) \| `null`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
// Callback pattern
rateLimit.get('my-queue', (err, rateLimit) => {
  if (err) {
    console.error('Failed to get rate limit:', err);
  } else if (rateLimit) {
    console.log(
      `Current rate limit: ${rateLimit.limit}/${rateLimit.interval}ms`,
    );
  } else {
    console.log('No rate limit set for this queue');
  }
});

// Promise pattern
try {
  const rateLimit = await rateLimit.get('my-queue');
  if (rateLimit) {
    console.log(
      `Rate limit: ${rateLimit.limit} messages per ${rateLimit.interval}ms`,
    );
  } else {
    console.log('Queue has no rate limit configured');
  }
} catch (err) {
  console.error('Failed to get rate limit:', err);
}
```

#### Call Signature

> **get**(`queue`, `cb`): `void`

Retrieves the current rate limit parameters for a specific message queue.

This method returns the currently configured rate limit for the queue,
or null if no rate limit is set.

##### Parameters

###### queue

The name of the queue or an IQueueParams object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) \| `null`\>

Optional callback function that is called with the rate limit. - On success: `cb(null, rateLimit)` where rateLimit is the current config or null. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the rate limit.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
// Callback pattern
rateLimit.get('my-queue', (err, rateLimit) => {
  if (err) {
    console.error('Failed to get rate limit:', err);
  } else if (rateLimit) {
    console.log(
      `Current rate limit: ${rateLimit.limit}/${rateLimit.interval}ms`,
    );
  } else {
    console.log('No rate limit set for this queue');
  }
});

// Promise pattern
try {
  const rateLimit = await rateLimit.get('my-queue');
  if (rateLimit) {
    console.log(
      `Rate limit: ${rateLimit.limit} messages per ${rateLimit.interval}ms`,
    );
  } else {
    console.log('Queue has no rate limit configured');
  }
} catch (err) {
  console.error('Failed to get rate limit:', err);
}
```

---

### hasExceeded()

#### Call Signature

> **hasExceeded**(`queue`, `rateLimit`): `Promise`\<`boolean`\>

Checks if the rate limit for a specific queue has been exceeded.

This method checks whether the number of messages processed in the current
time window has reached or exceeded the configured rate limit.

##### Parameters

###### queue

The name of the queue or an IQueueParams object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

An IQueueRateLimit object defining the rate limit parameters

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
// Callback pattern
rateLimit.hasExceeded(
  'my-queue',
  { limit: 100, interval: 60000 },
  (err, exceeded) => {
    if (err) {
      console.error('Failed to check rate limit:', err);
    } else if (exceeded) {
      console.log('Rate limit exceeded, please slow down');
    } else {
      console.log('Rate limit not exceeded, safe to process');
    }
  },
);

// Promise pattern
try {
  const exceeded = await rateLimit.hasExceeded('my-queue', {
    limit: 100,
    interval: 60000,
  });
  if (exceeded) {
    console.log('Rate limit exceeded, implementing backoff');
  } else {
    console.log('Rate limit OK, proceeding with processing');
  }
} catch (err) {
  console.error('Failed to check rate limit:', err);
}
```

#### Call Signature

> **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

Checks if the rate limit for a specific queue has been exceeded.

This method checks whether the number of messages processed in the current
time window has reached or exceeded the configured rate limit.

##### Parameters

###### queue

The name of the queue or an IQueueParams object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

An IQueueRateLimit object defining the rate limit parameters

###### cb

`ICallback`\<`boolean`\>

Optional callback function which receives a boolean value. - On success: `cb(null, exceeded)` where exceeded is true if rate limit exceeded. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the boolean.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
// Callback pattern
rateLimit.hasExceeded(
  'my-queue',
  { limit: 100, interval: 60000 },
  (err, exceeded) => {
    if (err) {
      console.error('Failed to check rate limit:', err);
    } else if (exceeded) {
      console.log('Rate limit exceeded, please slow down');
    } else {
      console.log('Rate limit not exceeded, safe to process');
    }
  },
);

// Promise pattern
try {
  const exceeded = await rateLimit.hasExceeded('my-queue', {
    limit: 100,
    interval: 60000,
  });
  if (exceeded) {
    console.log('Rate limit exceeded, implementing backoff');
  } else {
    console.log('Rate limit OK, proceeding with processing');
  }
} catch (err) {
  console.error('Failed to check rate limit:', err);
}
```

---

### set()

#### Call Signature

> **set**(`queue`, `rateLimit`): `Promise`\<`void`\>

Sets a rate limit for a specific queue.

Rate limiting is a common practice to control how many messages can be
processed within a certain timeframe, preventing overload on consumers and
ensuring fair usage of resources.

**Rate Limit Parameters:**

- `limit`: Maximum number of messages allowed within the interval
- `interval`: Time window in milliseconds (minimum 1000ms)

**Important Notes:**

- Rate limits are enforced at the queue level
- All consumers of the queue share the same rate limit
- The interval must be at least 1000ms (1 second)
- Rate limit must be a positive integer

##### Parameters

###### queue

The name of the queue or an IQueueParams object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

An IQueueRateLimit object specifying the rate limit configuration

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the rate limit value is invalid (<= 0).

##### Throws

When the interval is invalid (< 1000ms).

##### Throws

When Redis returns an unexpected response.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the queue is locked.

##### Example

```typescript
// Callback pattern - set rate limit to 100 messages per minute
rateLimit.set('my-queue', { limit: 100, interval: 60000 }, (err) => {
  if (err) {
    console.error('Failed to set rate limit:', err);
  } else {
    console.log('Rate limit set to 100 messages per minute');
  }
});

// Promise pattern - set rate limit to 10 messages per second
try {
  await rateLimit.set('orders-queue', { limit: 10, interval: 1000 });
  console.log('Rate limit set to 10 messages per second');
} catch (err) {
  console.error('Failed to set rate limit:', err);
}
```

#### Call Signature

> **set**(`queue`, `rateLimit`, `cb`): `void`

Sets a rate limit for a specific queue.

Rate limiting is a common practice to control how many messages can be
processed within a certain timeframe, preventing overload on consumers and
ensuring fair usage of resources.

**Rate Limit Parameters:**

- `limit`: Maximum number of messages allowed within the interval
- `interval`: Time window in milliseconds (minimum 1000ms)

**Important Notes:**

- Rate limits are enforced at the queue level
- All consumers of the queue share the same rate limit
- The interval must be at least 1000ms (1 second)
- Rate limit must be a positive integer

##### Parameters

###### queue

The name of the queue or an IQueueParams object

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

An IQueueRateLimit object specifying the rate limit configuration

###### cb

`ICallback`\<`void`\>

Optional callback function called when the rate limit is set. - On success: `cb(null)` - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves when set.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the rate limit value is invalid (<= 0).

##### Throws

When the interval is invalid (< 1000ms).

##### Throws

When Redis returns an unexpected response.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the queue is locked.

##### Example

```typescript
// Callback pattern - set rate limit to 100 messages per minute
rateLimit.set('my-queue', { limit: 100, interval: 60000 }, (err) => {
  if (err) {
    console.error('Failed to set rate limit:', err);
  } else {
    console.log('Rate limit set to 100 messages per minute');
  }
});

// Promise pattern - set rate limit to 10 messages per second
try {
  await rateLimit.set('orders-queue', { limit: 10, interval: 1000 });
  console.log('Rate limit set to 10 messages per second');
} catch (err) {
  console.error('Failed to set rate limit:', err);
}
```
