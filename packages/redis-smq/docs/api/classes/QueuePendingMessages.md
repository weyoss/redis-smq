[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueuePendingMessages

# Class: QueuePendingMessages

## Implements

- [`IQueueExplorer`](../interfaces/IQueueExplorer.md)

## Constructors

### Constructor

> **new QueuePendingMessages**(): `QueuePendingMessages`

#### Returns

`QueuePendingMessages`

## Methods

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### cb

`ICallback`\<`number`\>

#### Returns

`void`

#### Implementation of

[`IQueueExplorer`](../interfaces/IQueueExplorer.md).[`countMessages`](../interfaces/IQueueExplorer.md#countmessages)

***

### getMessages()

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### page

`number`

##### pageSize

`number`

##### cb

`ICallback`\<[`IPaginationPage`](../interfaces/IPaginationPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

#### Returns

`void`

#### Implementation of

[`IQueueExplorer`](../interfaces/IQueueExplorer.md).[`getMessages`](../interfaces/IQueueExplorer.md#getmessages)

***

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### cb

`ICallback`\<`void`\>

#### Returns

`void`

#### Implementation of

[`IQueueExplorer`](../interfaces/IQueueExplorer.md).[`purge`](../interfaces/IQueueExplorer.md#purge)
