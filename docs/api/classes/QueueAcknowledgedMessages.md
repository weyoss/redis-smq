[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueAcknowledgedMessages

# Class: QueueAcknowledgedMessages

## Hierarchy

- `QueueMessagesPaginatorList`

  ↳ **`QueueAcknowledgedMessages`**

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
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`number`\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorList.countMessages

___

### getMessages

▸ **getMessages**(`queue`, `cursor`, `pageSize`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cursor` | `number` |
| `pageSize` | `number` |
| `cb` | `ICallback`\<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)\<[`IConsumableMessage`](../interfaces/IConsumableMessage.md)\>\> |

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
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorList.purge

___

### requeueMessage

▸ **requeueMessage**(`source`, `id`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `id` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

QueueMessagesPaginatorList.requeueMessage
