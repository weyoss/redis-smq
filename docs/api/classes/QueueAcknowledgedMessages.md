>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueAcknowledgedMessages

# Class: QueueAcknowledgedMessages

## Contents

- [Constructors](QueueAcknowledgedMessages.md#constructors)
  - [new QueueAcknowledgedMessages()](QueueAcknowledgedMessages.md#new-queueacknowledgedmessages)
- [Methods](QueueAcknowledgedMessages.md#methods)
  - [countMessages()](QueueAcknowledgedMessages.md#countmessages)
  - [deleteMessage()](QueueAcknowledgedMessages.md#deletemessage)
  - [getMessages()](QueueAcknowledgedMessages.md#getmessages)
  - [purge()](QueueAcknowledgedMessages.md#purge)
  - [requeueMessage()](QueueAcknowledgedMessages.md#requeuemessage)

## Constructors

### new QueueAcknowledgedMessages()

> **new QueueAcknowledgedMessages**(): [`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

#### Returns

[`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

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

