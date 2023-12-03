[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueScheduledMessages

# Class: QueueScheduledMessages

## Hierarchy

- `QueueMessagesPaginatorSortedSet`

  ↳ **`QueueScheduledMessages`**

## Table of contents

### Constructors

- [constructor](QueueScheduledMessages.md#constructor)

### Methods

- [countMessages](QueueScheduledMessages.md#countmessages)
- [deleteMessage](QueueScheduledMessages.md#deletemessage)
- [getMessages](QueueScheduledMessages.md#getmessages)
- [purge](QueueScheduledMessages.md#purge)

## Constructors

### constructor

• **new QueueScheduledMessages**(): [`QueueScheduledMessages`](QueueScheduledMessages.md)

#### Returns

[`QueueScheduledMessages`](QueueScheduledMessages.md)

#### Inherited from

QueueMessagesPaginatorSortedSet.constructor

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

QueueMessagesPaginatorSortedSet.countMessages

___

### deleteMessage

▸ **deleteMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `messageId` | `string` \| `string`[] |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorSortedSet.deleteMessage

___

### getMessages

▸ **getMessages**(`queue`, `cursor`, `pageSize`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cursor` | `number` |
| `pageSize` | `number` |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`Message`](Message.md)\>\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorSortedSet.getMessages

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

QueueMessagesPaginatorSortedSet.purge
