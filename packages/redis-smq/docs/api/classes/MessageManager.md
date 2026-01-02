[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageManager

# Class: MessageManager

The MessageManager class provides methods for interacting with Redis-SMQ messages.
It utilizes the RedisClient to perform operations on Redis.

## Constructors

### Constructor

> **new MessageManager**(): `MessageManager`

#### Returns

`MessageManager`

## Methods

### deleteMessageById()

> **deleteMessageById**(`id`, `cb`): `void`

Deletes a message with the given ID.

#### Parameters

##### id

`string`

The ID of the message to delete.

##### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

A callback function that will be called with the result.
If an error occurs, the first parameter will be an Error object.
Otherwise, the second parameter will contain the deletion response.

#### Returns

`void`

---

### deleteMessagesByIds()

> **deleteMessagesByIds**(`ids`, `cb`): `void`

Deletes multiple messages by their IDs

#### Parameters

##### ids

`string`[]

Array of message IDs to delete

##### cb

`ICallback`\<[`IMessageManagerDeleteResponse`](../interfaces/IMessageManagerDeleteResponse.md)\>

Callback function that will be called with the deletion result
If an error occurs, the first parameter will be an Error object
Otherwise, the second parameter will contain the deletion response

#### Returns

`void`

---

### getMessageById()

> **getMessageById**(`messageId`, `cb`): `void`

Retrieves a message with the given ID.

#### Parameters

##### messageId

`string`

The ID of the message to retrieve.

##### cb

`ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>

A callback function that will be called with the result.
If an error occurs, the first parameter will be an Error object.
Otherwise, the second parameter will be the message object.

#### Returns

`void`

#### Throws

MessageNotFoundError

---

### getMessagesByIds()

> **getMessagesByIds**(`messageIds`, `cb`): `void`

Retrieves messages with the given IDs.

#### Parameters

##### messageIds

`string`[]

An array of IDs of the messages to retrieve.

##### cb

`ICallback`\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>[]\>

A callback function that will be called with the result.
If an error occurs, the first parameter will be an Error object.
Otherwise, the second parameter will be an array of message objects.

#### Returns

`void`

#### Throws

MessageNotFoundError

---

### getMessageState()

> **getMessageState**(`messageId`, `cb`): `void`

Retrieves the state of a message with the given ID.

#### Parameters

##### messageId

`string`

The ID of the message to retrieve the state for.

##### cb

`ICallback`\<[`IMessageStateTransferable`](../interfaces/IMessageStateTransferable.md)\>

A callback function that will be called with the result.
If an error occurs, the first parameter will be an Error object.
Otherwise, the second parameter will be the state of the message.

#### Returns

`void`

#### Throws

MessageNotFoundError

---

### getMessageStatus()

> **getMessageStatus**(`messageId`, `cb`): `void`

Retrieves the status of a message with the given ID.

#### Parameters

##### messageId

`string`

The ID of the message to retrieve the status for.

##### cb

`ICallback`\<[`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)\>

A callback function that will be called with the result.
If an error occurs, the first parameter will be an Error object.
Otherwise, the second parameter will be the status of the message.

#### Returns

`void`

#### Throws

MessageNotFoundError

---

### requeueMessageById()

> **requeueMessageById**(`messageId`, `cb`): `void`

Requeues a message with the given ID.
A requeued message is created as a new message. The old message is not deleted
but its state is updated to reflect that it has been requeued.

#### Parameters

##### messageId

`string`

The ID of the message to requeue.

##### cb

`ICallback`\<`string`\>

A callback function that will be called with the result.
If an error occurs, the first parameter will be an Error object.
On success, the second parameter will be the ID of the new message.

#### Returns

`void`

#### Throws

MessageNotFoundError

#### Throws

MessageNotRequeuableError

#### Throws

RequeueMessageScriptError

#### Throws

UnexpectedScriptReplyError
