[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IQueueMessages

# Interface: IQueueMessages

## Contents

- [Methods](IQueueMessages.md#methods)
  - [countMessages()](IQueueMessages.md#countmessages)
  - [deleteMessage()](IQueueMessages.md#deletemessage)
  - [getMessages()](IQueueMessages.md#getmessages)
  - [purge()](IQueueMessages.md#purge)

## Methods

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](IQueueParams.md)

▪ **cb**: `ICallback`<`number`>

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](IQueueParams.md)

▪ **messageId**: `string`

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### getMessages()

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](IQueueParams.md)

▪ **page**: `number`

▪ **pageSize**: `number`

▪ **cb**: `ICallback`<[`IQueueMessagesPage`](IQueueMessagesPage.md)<[`Message`](../classes/Message.md)>>

#### Returns

`void`

***

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

