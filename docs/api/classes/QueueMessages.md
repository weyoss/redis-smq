[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessages

# Class: QueueMessages

## Hierarchy

- `QueueMessagesPaginatorSet`

  ↳ **`QueueMessages`**

## Table of contents

### Constructors

- [constructor](QueueMessages.md#constructor)

### Methods

- [countMessages](QueueMessages.md#countmessages)
- [countMessagesByStatus](QueueMessages.md#countmessagesbystatus)
- [getMessages](QueueMessages.md#getmessages)
- [purge](QueueMessages.md#purge)

## Constructors

### constructor

• **new QueueMessages**(): [`QueueMessages`](QueueMessages.md)

#### Returns

[`QueueMessages`](QueueMessages.md)

#### Inherited from

QueueMessagesPaginatorSet.constructor

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

#### Inherited from

QueueMessagesPaginatorSet.countMessages

___

### countMessagesByStatus

▸ **countMessagesByStatus**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<[`IQueueMessagesCount`](../interfaces/IQueueMessagesCount.md)\> |

#### Returns

`void`

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

#### Inherited from

QueueMessagesPaginatorSet.getMessages

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

#### Inherited from

QueueMessagesPaginatorSet.purge
