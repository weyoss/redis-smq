[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueScheduledMessages

# Class: QueueScheduledMessages

## Hierarchy

- `QueueMessagesManagerAbstract`

  ↳ **`QueueScheduledMessages`**

## Table of contents

### Constructors

- [constructor](QueueScheduledMessages.md#constructor)

### Methods

- [countMessages](QueueScheduledMessages.md#countmessages)
- [getMessages](QueueScheduledMessages.md#getmessages)
- [purge](QueueScheduledMessages.md#purge)
- [shutdown](QueueScheduledMessages.md#shutdown)

## Constructors

### constructor

• **new QueueScheduledMessages**(): [`QueueScheduledMessages`](QueueScheduledMessages.md)

#### Returns

[`QueueScheduledMessages`](QueueScheduledMessages.md)

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

Shuts down the manager and its dependencies gracefully.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | Callback function |

#### Returns

`void`

#### Inherited from

QueueMessagesManagerAbstract.shutdown
