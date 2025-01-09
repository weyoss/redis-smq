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
- [getMessages](QueueScheduledMessages.md#getmessages)
- [purge](QueueScheduledMessages.md#purge)
- [shutdown](QueueScheduledMessages.md#shutdown)

## Constructors

### constructor

• **new QueueScheduledMessages**()

#### Inherited from

QueueMessagesPaginatorSortedSet.constructor

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

#### Inherited from

QueueMessagesPaginatorSortedSet.countMessages

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

#### Inherited from

QueueMessagesPaginatorSortedSet.getMessages

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

#### Inherited from

QueueMessagesPaginatorSortedSet.purge

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorSortedSet.shutdown
