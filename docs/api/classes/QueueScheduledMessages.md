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
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`IConsumableMessage`](../interfaces/IConsumableMessage.md)\>\> |

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
