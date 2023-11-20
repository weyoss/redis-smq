>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueScheduledMessages

# Class: QueueScheduledMessages

## Contents

- [Constructors](QueueScheduledMessages.md#constructors)
  - [new QueueScheduledMessages()](QueueScheduledMessages.md#new-queuescheduledmessages)
- [Methods](QueueScheduledMessages.md#methods)
  - [countMessages()](QueueScheduledMessages.md#countmessages)
  - [deleteMessage()](QueueScheduledMessages.md#deletemessage)
  - [getMessages()](QueueScheduledMessages.md#getmessages)
  - [purge()](QueueScheduledMessages.md#purge)

## Constructors

### new QueueScheduledMessages()

> **new QueueScheduledMessages**(): [`QueueScheduledMessages`](QueueScheduledMessages.md)

#### Returns

[`QueueScheduledMessages`](QueueScheduledMessages.md)

## Methods

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`number`>

#### Returns

`void`

### deleteMessage()

> **deleteMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **messageId**: `string` | `string`[]

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

### getMessages()

> **getMessages**(`queue`, `cursor`, `pageSize`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cursor**: `number`

▪ **pageSize**: `number`

▪ **cb**: `ICallback`<[`IQueueMessagesPage`](../interfaces/IQueueMessagesPage.md)<[`Message`](Message.md)>>

#### Returns

`void`

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

