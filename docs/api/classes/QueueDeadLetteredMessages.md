[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueDeadLetteredMessages

# Class: QueueDeadLetteredMessages

## Hierarchy

- `QueueMessagesPaginatorList`

  ↳ **`QueueDeadLetteredMessages`**

## Implements

- [`IQueueMessagesRequeuable`](../interfaces/IQueueMessagesRequeuable.md)

## Table of contents

### Constructors

- [constructor](QueueDeadLetteredMessages.md#constructor)

### Methods

- [countMessages](QueueDeadLetteredMessages.md#countmessages)
- [getMessages](QueueDeadLetteredMessages.md#getmessages)
- [purge](QueueDeadLetteredMessages.md#purge)
- [requeueMessage](QueueDeadLetteredMessages.md#requeuemessage)
- [shutdown](QueueDeadLetteredMessages.md#shutdown)

## Constructors

### constructor

• **new QueueDeadLetteredMessages**(): [`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

#### Returns

[`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

#### Inherited from

QueueMessagesPaginatorList.constructor

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

QueueMessagesPaginatorList.countMessages

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

QueueMessagesPaginatorList.getMessages

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

QueueMessagesPaginatorList.purge

___

### requeueMessage

▸ **requeueMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `messageId` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Implementation of

[IQueueMessagesRequeuable](../interfaces/IQueueMessagesRequeuable.md).[requeueMessage](../interfaces/IQueueMessagesRequeuable.md#requeuemessage)

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

QueueMessagesPaginatorList.shutdown
