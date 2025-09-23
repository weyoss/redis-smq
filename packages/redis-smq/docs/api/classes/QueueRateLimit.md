[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimit

# Class: QueueRateLimit

The QueueRateLimit class provides functionality to manage rate limiting for
message queues. It allows to set, get, check, and clear rate limits on
specified queues. The rate limiting mechanism helps ensure fair usage of
resources by controlling the number of messages processed within a defined
timeframe.

## Constructors

### Constructor

> **new QueueRateLimit**(): `QueueRateLimit`

#### Returns

`QueueRateLimit`

## Methods

### clear()

> **clear**(`queue`, `cb`): `void`

Resets or clears the rate limit settings for a specific queue.

#### Parameters

##### queue

The name of the queue or an IQueueParams object representing the queue.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`void`\>

A callback function which receives an error or undefined when the operation is complete.

#### Returns

`void`

***

### get()

> **get**(`queue`, `cb`): `void`

Retrieves the current rate limit parameters for a specific message queue.

#### Parameters

##### queue

The name of the queue or an IQueueParams object containing the queue configuration.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`null` \| [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)\>

A callback function that is called once the rate limit has been fetched.
It receives either the current rate limit parameters or null if not set.

#### Returns

`void`

***

### hasExceeded()

> **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

Checks if the rate limit for a specific queue has been exceeded.

#### Parameters

##### queue

The name of the queue or an IQueueParams object containing the queue configuration.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

An IQueueRateLimit object defining the rate limit parameters.

##### cb

`ICallback`\<`boolean`\>

A callback function which receives a boolean value indicating whether the rate limit has been exceeded.

#### Returns

`void`

***

### set()

> **set**(`queue`, `rateLimit`, `cb`): `void`

Sets a rate limit for a specific queue.

Rate limiting is a common practice to control how many messages can be
processed within a certain timeframe, preventing overload on consumers and
ensuring fair usage of resources.

#### Parameters

##### queue

The name of the queue or an IQueueParams object. This is the queue for which you want to set a rate limit.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### rateLimit

[`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

An IQueueRateLimit object specifying the rate limit configuration (limit and interval).

##### cb

`ICallback`\<`void`\>

A callback function called when the rate limit is set successfully. No arguments are passed.

#### Returns

`void`
