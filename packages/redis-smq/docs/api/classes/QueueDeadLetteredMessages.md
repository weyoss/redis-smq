[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueDeadLetteredMessages

# Class: QueueDeadLetteredMessages

## Hierarchy

- `QueueMessagesManagerAbstract`

  ↳ **`QueueDeadLetteredMessages`**

## Table of contents

### Constructors

- [constructor](QueueDeadLetteredMessages.md#constructor)

### Methods

- [countMessages](QueueDeadLetteredMessages.md#countmessages)
- [getMessages](QueueDeadLetteredMessages.md#getmessages)
- [purge](QueueDeadLetteredMessages.md#purge)
- [shutdown](QueueDeadLetteredMessages.md#shutdown)

## Constructors

### constructor

• **new QueueDeadLetteredMessages**(): [`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

#### Returns

[`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

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

Purges all messages from the specified queue.

Different message types can be purged using specific classes:
- [QueueMessages](QueueMessages.md) - Delete all queue messages
- [QueueAcknowledgedMessages](QueueAcknowledgedMessages.md) - Delete acknowledged messages (if configured to be stored)
- [QueueDeadLetteredMessages](QueueDeadLetteredMessages.md) - Delete dead-lettered messages (if configured to be stored)
- [QueueScheduledMessages](QueueScheduledMessages.md) - Delete scheduled messages
- [QueuePendingMessages](QueuePendingMessages.md) - Delete pending messages

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) | The queue to purge. Can be a string, queue parameters object, or queue consumer group parameters. |
| `cb` | `ICallback`\<`void`\> | Callback function that will be invoked when the operation completes. If an error occurs, the first parameter will contain the Error object. Otherwise, the first parameter will be null/undefined. |

#### Returns

`void`

#### Inherited from

QueueMessagesManagerAbstract.purge

___

### shutdown

▸ **shutdown**(`cb`): `void`

Shuts down the manager and its dependencies gracefully.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | Callback function |

#### Returns

`void`

#### Inherited from

QueueMessagesManagerAbstract.shutdown
