[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueuePendingMessages

# Class: QueuePendingMessages

## Implements

- [`IMessageBrowser`](../interfaces/IMessageBrowser.md)

## Constructors

### Constructor

> **new QueuePendingMessages**(): `QueuePendingMessages`

#### Returns

`QueuePendingMessages`

## Methods

### cancelPurge()

> **cancelPurge**(`queue`, `jobId`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### jobId

`string`

##### cb

`ICallback`

#### Returns

`void`

#### Implementation of

[`IMessageBrowser`](../interfaces/IMessageBrowser.md).[`cancelPurge`](../interfaces/IMessageBrowser.md#cancelpurge)

---

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

[`IMessageBrowser`](../interfaces/IMessageBrowser.md).[`countMessages`](../interfaces/IMessageBrowser.md#countmessages)

---

### getMessageIds()

> **getMessageIds**(`queue`, `page`, `pageSize`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### page

`number`

##### pageSize

`number`

##### cb

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<`string`\>\>

#### Returns

`void`

#### Implementation of

[`IMessageBrowser`](../interfaces/IMessageBrowser.md).[`getMessageIds`](../interfaces/IMessageBrowser.md#getmessageids)

---

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

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

#### Returns

`void`

#### Implementation of

[`IMessageBrowser`](../interfaces/IMessageBrowser.md).[`getMessages`](../interfaces/IMessageBrowser.md#getmessages)

---

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### cb

`ICallback`\<`string`\>

#### Returns

`void`

#### Implementation of

[`IMessageBrowser`](../interfaces/IMessageBrowser.md).[`purge`](../interfaces/IMessageBrowser.md#purge)
