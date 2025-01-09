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
- [shutdown](QueuePendingMessages.md#shutdown)

## Constructors

### constructor

• **new QueuePendingMessages**()

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

[IQueueMessages](../interfaces/IQueueMessages.md).[countMessages](../interfaces/IQueueMessages.md#countmessages)

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

[IQueueMessages](../interfaces/IQueueMessages.md).[getMessages](../interfaces/IQueueMessages.md#getmessages)

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

[IQueueMessages](../interfaces/IQueueMessages.md).[purge](../interfaces/IQueueMessages.md#purge)

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
