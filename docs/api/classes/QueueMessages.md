>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessages

# Class: QueueMessages

## Contents

- [Constructors](QueueMessages.md#constructors)
  - [new QueueMessages()](QueueMessages.md#new-queuemessages)
- [Methods](QueueMessages.md#methods)
  - [countMessages()](QueueMessages.md#countmessages)
  - [countMessagesByStatus()](QueueMessages.md#countmessagesbystatus)
  - [deleteMessage()](QueueMessages.md#deletemessage)
  - [deleteMessagesById()](QueueMessages.md#deletemessagesbyid)
  - [deleteMessagesByIds()](QueueMessages.md#deletemessagesbyids)
  - [getMessageById()](QueueMessages.md#getmessagebyid)
  - [getMessages()](QueueMessages.md#getmessages)
  - [getMessagesByIds()](QueueMessages.md#getmessagesbyids)
  - [purge()](QueueMessages.md#purge)

## Constructors

### new QueueMessages()

> **new QueueMessages**(): [`QueueMessages`](QueueMessages.md)

#### Returns

[`QueueMessages`](QueueMessages.md)

## Methods

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`number`>

#### Returns

`void`

### countMessagesByStatus()

> **countMessagesByStatus**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<[`IQueueMessagesCount`](../interfaces/IQueueMessagesCount.md)>

#### Returns

`void`

***

### deleteMessage()

> **deleteMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **messageId**: `string` | `string`[]

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

### deleteMessagesById()

> **deleteMessagesById**(`id`, `cb`): `void`

#### Parameters

▪ **id**: `string`

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### deleteMessagesByIds()

> **deleteMessagesByIds**(`ids`, `cb`): `void`

#### Parameters

▪ **ids**: `string`[]

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### getMessageById()

> **getMessageById**(`messageId`, `cb`): `void`

#### Parameters

▪ **messageId**: `string`

▪ **cb**: `ICallback`<[`Message`](Message.md)>

#### Returns

`void`

***

### getMessages()

> **getMessages**(`queue`, `cursor`, `pageSize`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cursor**: `number`

▪ **pageSize**: `number`

▪ **cb**: `ICallback`<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)<[`Message`](Message.md)>>

#### Returns

`void`

### getMessagesByIds()

> **getMessagesByIds**(`messageIds`, `cb`): `void`

#### Parameters

▪ **messageIds**: `string`[]

▪ **cb**: `ICallback`<[`Message`](Message.md)[]>

#### Returns

`void`

***

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

