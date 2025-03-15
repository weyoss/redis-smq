[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IQueueMessages

# Interface: IQueueMessages

## Implemented by

- [`QueuePendingMessages`](../classes/QueuePendingMessages.md)

## Table of contents

### Methods

- [countMessages](IQueueMessages.md#countmessages)
- [getMessages](IQueueMessages.md#getmessages)
- [purge](IQueueMessages.md#purge)

## Methods

### countMessages

▸ **countMessages**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `cb` | `ICallback`\<`number`\> |

#### Returns

`void`

___

### getMessages

▸ **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `page` | `number` |
| `pageSize` | `number` |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](IQueueMessagesPage.md)\<[`IMessageTransferable`](IMessageTransferable.md)\>\> |

#### Returns

`void`

___

### purge

▸ **purge**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
