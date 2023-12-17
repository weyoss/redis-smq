[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueuePendingMessages

# Class: QueuePendingMessages

## Implements

- [`IQueueMessages`](../interfaces/IQueueMessages.md)

## Table of contents

### Constructors

- [constructor](QueuePendingMessages.md#constructor)

### Methods

- [countMessages](QueuePendingMessages.md#countmessages)
- [getMessages](QueuePendingMessages.md#getmessages)
- [purge](QueuePendingMessages.md#purge)

## Constructors

### constructor

• **new QueuePendingMessages**(): [`QueuePendingMessages`](QueuePendingMessages.md)

#### Returns

[`QueuePendingMessages`](QueuePendingMessages.md)

## Methods

### countMessages

▸ **countMessages**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`number`\> |

#### Returns

`void`

#### Implementation of

[IQueueMessages](../interfaces/IQueueMessages.md).[countMessages](../interfaces/IQueueMessages.md#countmessages)

___

### getMessages

▸ **getMessages**(`queue`, `cursor`, `pageSize`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cursor` | `number` |
| `pageSize` | `number` |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`IConsumableMessage`](../interfaces/IConsumableMessage.md)\>\> |

#### Returns

`void`

#### Implementation of

[IQueueMessages](../interfaces/IQueueMessages.md).[getMessages](../interfaces/IQueueMessages.md#getmessages)

___

### purge

▸ **purge**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Implementation of

[IQueueMessages](../interfaces/IQueueMessages.md).[purge](../interfaces/IQueueMessages.md#purge)
