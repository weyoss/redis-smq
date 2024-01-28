[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueAcknowledgedMessages

# Class: QueueAcknowledgedMessages

## Hierarchy

- `QueueMessagesPaginatorList`

  ↳ **`QueueAcknowledgedMessages`**

## Implements

- [`IQueueMessagesRequeuable`](../interfaces/IQueueMessagesRequeuable.md)

## Table of contents

### Constructors

- [constructor](QueueAcknowledgedMessages.md#constructor)

### Methods

- [countMessages](QueueAcknowledgedMessages.md#countmessages)
- [getMessages](QueueAcknowledgedMessages.md#getmessages)
- [purge](QueueAcknowledgedMessages.md#purge)
- [requeueMessage](QueueAcknowledgedMessages.md#requeuemessage)

## Constructors

### constructor

• **new QueueAcknowledgedMessages**(): [`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

#### Returns

[`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

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
