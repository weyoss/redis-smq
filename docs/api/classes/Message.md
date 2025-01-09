[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Message

# Class: Message

## Table of contents

### Constructors

- [constructor](Message.md#constructor)

### Methods

- [deleteMessageById](Message.md#deletemessagebyid)
- [deleteMessagesByIds](Message.md#deletemessagesbyids)
- [getMessageById](Message.md#getmessagebyid)
- [getMessageState](Message.md#getmessagestate)
- [getMessageStatus](Message.md#getmessagestatus)
- [getMessagesByIds](Message.md#getmessagesbyids)
- [requeueMessageById](Message.md#requeuemessagebyid)
- [shutdown](Message.md#shutdown)

## Constructors

### constructor

• **new Message**()

## Methods

### deleteMessageById

▸ **deleteMessageById**(`id`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### deleteMessagesByIds

▸ **deleteMessagesByIds**(`ids`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ids` | `string`[] |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getMessageById

▸ **getMessageById**(`messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | `string` |
| `cb` | `ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\> |

#### Returns

`void`

___

### getMessageState

▸ **getMessageState**(`messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | `string` |
| `cb` | `ICallback`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\> |

#### Returns

`void`

___

### getMessageStatus

▸ **getMessageStatus**(`messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | `string` |
| `cb` | `ICallback`\<[`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)\> |

#### Returns

`void`

___

### getMessagesByIds

▸ **getMessagesByIds**(`messageIds`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageIds` | `string`[] |
| `cb` | `ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)[]\> |

#### Returns

`void`

___

### requeueMessageById

▸ **requeueMessageById**(`messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageId` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
