[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Message

# Class: Message

The Message class provides methods for interacting with Redis-SMQ messages.
It utilizes the RedisClient to perform operations on Redis.

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

• **new Message**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

## Methods

### deleteMessageById

▸ **deleteMessageById**(`id`, `cb`): `void`

Deletes a message with the given ID.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | The ID of the message to delete. |
| `cb` | `ICallback`\<`void`\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be undefined. |

#### Returns

`void`

___

### deleteMessagesByIds

▸ **deleteMessagesByIds**(`ids`, `cb`): `void`

Deletes messages with the given IDs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ids` | `string`[] | An array of IDs of the messages to delete. |
| `cb` | `ICallback`\<`void`\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be undefined. |

#### Returns

`void`

___

### getMessageById

▸ **getMessageById**(`messageId`, `cb`): `void`

Retrieves a message with the given ID.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | `string` | The ID of the message to retrieve. |
| `cb` | `ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be the message object. |

#### Returns

`void`

___

### getMessageState

▸ **getMessageState**(`messageId`, `cb`): `void`

Retrieves the state of a message with the given ID.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | `string` | The ID of the message to retrieve the state for. |
| `cb` | `ICallback`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be the state of the message. |

#### Returns

`void`

___

### getMessageStatus

▸ **getMessageStatus**(`messageId`, `cb`): `void`

Retrieves the status of a message with the given ID.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | `string` | The ID of the message to retrieve the status for. |
| `cb` | `ICallback`\<[`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be the status of the message. |

#### Returns

`void`

___

### getMessagesByIds

▸ **getMessagesByIds**(`messageIds`, `cb`): `void`

Retrieves messages with the given IDs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageIds` | `string`[] | An array of IDs of the messages to retrieve. |
| `cb` | `ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)[]\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be an array of message objects. |

#### Returns

`void`

___

### requeueMessageById

▸ **requeueMessageById**(`messageId`, `cb`): `void`

Requeues a message with the given ID.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageId` | `string` | The ID of the message to requeue. |
| `cb` | `ICallback`\<`void`\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be undefined. |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

Shuts down the Redis client and performs cleanup operations.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | A callback function that will be called with the result. If an error occurs, the first parameter will be an Error object. Otherwise, the second parameter will be undefined. |

#### Returns

`void`
