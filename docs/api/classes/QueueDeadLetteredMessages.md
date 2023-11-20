>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueDeadLetteredMessages

# Class: QueueDeadLetteredMessages

## Contents

- [Constructors](QueueDeadLetteredMessages.md#constructors)
  - [new QueueDeadLetteredMessages()](QueueDeadLetteredMessages.md#new-queuedeadletteredmessages)
- [Methods](QueueDeadLetteredMessages.md#methods)
  - [countMessages()](QueueDeadLetteredMessages.md#countmessages)
  - [deleteMessage()](QueueDeadLetteredMessages.md#deletemessage)
  - [getMessages()](QueueDeadLetteredMessages.md#getmessages)
  - [purge()](QueueDeadLetteredMessages.md#purge)
  - [requeueMessage()](QueueDeadLetteredMessages.md#requeuemessage)

## Constructors

### new QueueDeadLetteredMessages()

> **new QueueDeadLetteredMessages**(): [`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

#### Returns

[`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

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

### requeueMessage()

> **requeueMessage**(`source`, `id`, `cb`): `void`

#### Parameters

▪ **source**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **id**: `string`

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

