[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IQueueMessages

# Interface: IQueueMessages

## Implemented by

- [`QueuePendingMessages`](../classes/QueuePendingMessages.md)

## Table of contents

### Methods

- [countMessages](IQueueMessages.md#countmessages)
- [deleteMessage](IQueueMessages.md#deletemessage)
- [getMessages](IQueueMessages.md#getmessages)
- [purge](IQueueMessages.md#purge)

## Methods

### countMessages

▸ **countMessages**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](IQueueParams.md) |
| `cb` | `ICallback`\<`number`\> |

#### Returns

`void`

___

### deleteMessage

▸ **deleteMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](IQueueParams.md) |
| `messageId` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getMessages

▸ **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](IQueueParams.md) |
| `page` | `number` |
| `pageSize` | `number` |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](IQueueMessagesPage.md)\<[`Message`](../classes/Message.md)\>\> |

#### Returns

`void`

___

### purge

▸ **purge**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
