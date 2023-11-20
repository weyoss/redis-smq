>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueuePendingMessages

# Class: QueuePendingMessages

## Contents

- [Implements](QueuePendingMessages.md#implements)
- [Constructors](QueuePendingMessages.md#constructors)
  - [new QueuePendingMessages()](QueuePendingMessages.md#new-queuependingmessages)
- [Methods](QueuePendingMessages.md#methods)
  - [countMessages()](QueuePendingMessages.md#countmessages)
  - [deleteMessage()](QueuePendingMessages.md#deletemessage)
  - [getMessages()](QueuePendingMessages.md#getmessages)
  - [purge()](QueuePendingMessages.md#purge)

## Implements

- [`IQueueMessages`](../interfaces/IQueueMessages.md)

## Constructors

### new QueuePendingMessages()

> **new QueuePendingMessages**(): [`QueuePendingMessages`](QueuePendingMessages.md)

#### Returns

[`QueuePendingMessages`](QueuePendingMessages.md)

## Methods

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`number`>

#### Returns

`void`

#### Implementation of

[`IQueueMessages`](../interfaces/IQueueMessages.md).[`countMessages`](../interfaces/IQueueMessages.md#countmessages)

***

### deleteMessage()

> **deleteMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **messageId**: `string`

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

#### Implementation of

[`IQueueMessages`](../interfaces/IQueueMessages.md).[`deleteMessage`](../interfaces/IQueueMessages.md#deletemessage)

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

#### Implementation of

[`IQueueMessages`](../interfaces/IQueueMessages.md).[`getMessages`](../interfaces/IQueueMessages.md#getmessages)

***

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

#### Implementation of

[`IQueueMessages`](../interfaces/IQueueMessages.md).[`purge`](../interfaces/IQueueMessages.md#purge)

