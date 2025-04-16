[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessages

# Class: QueueMessages

QueueMessages class manages message counting and state reporting across queue types.
It orchestrates various message handlers (pending, acknowledged, scheduled, dead-lettered)
and leverages a waterfall pattern for processing.

## Hierarchy

- `QueueMessagesManagerAbstract`

  ↳ **`QueueMessages`**

## Table of contents

### Constructors

- [constructor](QueueMessages.md#constructor)

### Methods

- [countMessages](QueueMessages.md#countmessages)
- [countMessagesByStatus](QueueMessages.md#countmessagesbystatus)
- [getMessages](QueueMessages.md#getmessages)
- [purge](QueueMessages.md#purge)
- [shutdown](QueueMessages.md#shutdown)

## Constructors

### constructor

• **new QueueMessages**(): [`QueueMessages`](QueueMessages.md)

#### Returns

[`QueueMessages`](QueueMessages.md)

#### Overrides

QueueMessagesManagerAbstract.constructor

## Methods

### countMessages

▸ **countMessages**(`queue`, `cb`): `void`

Counts the total number of messages in the queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) | Extended queue parameters |
| `cb` | `ICallback`\<`number`\> | Callback returning the count |

#### Returns

`void`

#### Inherited from

QueueMessagesManagerAbstract.countMessages

___

### countMessagesByStatus

▸ **countMessagesByStatus**(`queue`, `cb`): `void`

Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | Queue string name or parameters. |
| `cb` | `ICallback`\<[`IQueueMessagesCount`](../interfaces/IQueueMessagesCount.md)\> | Callback function returning the IQueueMessagesCount. |

#### Returns

`void`

___

### getMessages

▸ **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

Retrieves detailed messages for a specific page.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) | Extended queue parameters |
| `page` | `number` | Page number |
| `pageSize` | `number` | Number of items per page |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\>\> | Callback returning an IQueueMessagesPage of IMessageTransferable |

#### Returns

`void`

#### Inherited from

QueueMessagesManagerAbstract.getMessages

___

### purge

▸ **purge**(`queue`, `cb`): `void`

Purges all messages from the queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) | Extended queue parameters |
| `cb` | `ICallback`\<`void`\> | Callback function |

#### Returns

`void`

#### Inherited from

QueueMessagesManagerAbstract.purge

___

### shutdown

▸ **shutdown**(`cb`): `void`

Gracefully shut down all message handlers and parent resources.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | Callback invoked on shutdown completion. |

#### Returns

`void`

#### Overrides

QueueMessagesManagerAbstract.shutdown
