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
- [deleteMessage](QueueMessages.md#deletemessage)
- [deleteMessageById](QueueMessages.md#deletemessagebyid)
- [deleteMessagesByIds](QueueMessages.md#deletemessagesbyids)
- [getMessageById](QueueMessages.md#getmessagebyid)
- [getMessages](QueueMessages.md#getmessages)
- [getMessagesByIds](QueueMessages.md#getmessagesbyids)
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

QueueMessagesPaginatorSet.deleteMessage

___

### deleteMessageById

▸ **deleteMessageById**(`id`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### deleteMessagesByIds

▸ **deleteMessagesByIds**(`ids`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ids` | `string`[] |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getMessageById

▸ **getMessageById**(`messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | `string` |
| `cb` | `ICallback`\<[`Message`](Message.md)\> |

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
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`Message`](Message.md)\>\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorSet.getMessages

___

### getMessagesByIds

▸ **getMessagesByIds**(`messageIds`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageIds` | `string`[] |
| `cb` | `ICallback`\<[`Message`](Message.md)[]\> |

#### Returns

`void`

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
