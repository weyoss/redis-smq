[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimit

# Class: QueueRateLimit

The QueueRateLimit class provides functionality to manage rate limiting for
message queues. It allows to set, get, check, and clear rate limits on
specified queues. The rate limiting mechanism helps ensure fair usage of
resources by controlling the number of messages processed within a defined
timeframe.

## Table of contents

### Constructors

- [constructor](QueueRateLimit.md#constructor)

### Methods

- [clear](QueueRateLimit.md#clear)
- [get](QueueRateLimit.md#get)
- [hasExceeded](QueueRateLimit.md#hasexceeded)
- [set](QueueRateLimit.md#set)
- [shutdown](QueueRateLimit.md#shutdown)

## Constructors

### constructor

• **new QueueRateLimit**(): [`QueueRateLimit`](QueueRateLimit.md)

#### Returns

[`QueueRateLimit`](QueueRateLimit.md)

## Methods

### clear

▸ **clear**(`queue`, `cb`): `void`

Resets or clears the rate limit settings for a specific queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object representing the queue. |
| `cb` | `ICallback`\<`void`\> | A callback function which receives an error or undefined when the operation is complete. |

#### Returns

`void`

___

### get

▸ **get**(`queue`, `cb`): `void`

Retrieves the current rate limit parameters for a specific message queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object containing the queue configuration. |
| `cb` | `ICallback`\<``null`` \| [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)\> | A callback function that is called once the rate limit has been fetched. It receives either the current rate limit parameters or null if not set. |

#### Returns

`void`

___

### hasExceeded

▸ **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

Checks if the rate limit for a specific queue has been exceeded.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object containing the queue configuration. |
| `rateLimit` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) | An IQueueRateLimit object defining the rate limit parameters. |
| `cb` | `ICallback`\<`boolean`\> | A callback function which receives a boolean value indicating whether the rate limit has been exceeded. |

#### Returns

`void`

___

### set

▸ **set**(`queue`, `rateLimit`, `cb`): `void`

Sets a rate limit for a specific queue.

Rate limiting is a common practice to control how many messages can be
processed within a certain timeframe, preventing overload on consumers and
ensuring fair usage of resources.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object. This is the queue for which you want to set a rate limit. |
| `rateLimit` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) | An IQueueRateLimit object specifying the rate limit configuration (limit and interval). |
| `cb` | `ICallback`\<`void`\> | A callback function called when the rate limit is set successfully. No arguments are passed. |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

Cleans up resources by shutting down the Redis client and the queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | A callback function to handle completion of the shutdown process. |

#### Returns

`void`
