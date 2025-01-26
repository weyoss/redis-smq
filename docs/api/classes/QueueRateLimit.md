[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimit

# Class: QueueRateLimit

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

Reset or clear the rate limit settings for a specific queue.

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### get

▸ **get**(`queue`, `cb`): `void`

Retrieve the current rate limit parameters for a specific message queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object that contains the queue configuration. |
| `cb` | `ICallback`\<``null`` \| [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)\> | A callback function that will be called once the rate limit has been fetched. |

#### Returns

`void`

___

### hasExceeded

▸ **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

Check if the rate limit for a specific queue has been exceeded.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object that contains the queue configuration. |
| `rateLimit` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) | An IQueueRateLimit object that defines the rate limit parameters. |
| `cb` | `ICallback`\<`boolean`\> | A callback function that takes a boolean value as an argument, indicating whether the rate limit has been exceeded. |

#### Returns

`void`

___

### set

▸ **set**(`queue`, `rateLimit`, `cb`): `void`

Set a rate limit for a specific queue.

Rate limiting is a common practice to control how many messages can be
processed within a certain timeframe, preventing overload on consumers and
ensuring fair usage of resources.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The name of the queue or an IQueueParams object. This is the queue for which you want to set a rate limit. |
| `rateLimit` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) | An IQueueRateLimit object that specifies the rate limit configuration. |
| `cb` | `ICallback`\<`void`\> | A callback function that is called when the rate limit is set successfully. The callback function takes no arguments and returns no value. |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
