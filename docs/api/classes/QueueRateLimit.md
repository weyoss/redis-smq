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

• **new QueueRateLimit**()

## Methods

### clear

▸ **clear**(`queue`, `cb`): `void`

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

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<``null`` \| [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)\> |

#### Returns

`void`

___

### hasExceeded

▸ **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `rateLimit` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) |
| `cb` | `ICallback`\<`boolean`\> |

#### Returns

`void`

___

### set

▸ **set**(`queue`, `rateLimit`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `rateLimit` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md) |
| `cb` | `ICallback`\<`void`\> |

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
