[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueuePendingMessages

# Class: QueuePendingMessages

## Implements

- [`IQueueMessageManager`](../interfaces/IQueueMessageManager.md)

## Table of contents

### Constructors

- [constructor](QueuePendingMessages.md#constructor)

### Methods

- [countMessages](QueuePendingMessages.md#countmessages)
- [getMessages](QueuePendingMessages.md#getmessages)
- [purge](QueuePendingMessages.md#purge)
- [shutdown](QueuePendingMessages.md#shutdown)

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
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `cb` | `ICallback`\<`number`\> |

#### Returns

`void`

#### Implementation of

[IQueueMessageManager](../interfaces/IQueueMessageManager.md).[countMessages](../interfaces/IQueueMessageManager.md#countmessages)

___

### getMessages

▸ **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `page` | `number` |
| `pageSize` | `number` |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\>\> |

#### Returns

`void`

#### Implementation of

[IQueueMessageManager](../interfaces/IQueueMessageManager.md).[getMessages](../interfaces/IQueueMessageManager.md#getmessages)

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

#### Implementation of

[IQueueMessageManager](../interfaces/IQueueMessageManager.md).[purge](../interfaces/IQueueMessageManager.md#purge)

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
