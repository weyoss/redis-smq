[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageBrowser

# Interface: IMessageBrowser

## Properties

### messageType

> `readonly` **messageType**: [`EQueueMessageType`](../enumerations/EQueueMessageType.md)

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

`ICallback`\<[`IBrowserPage`](IBrowserPage.md)\<`string`\>\>

#### Returns

`void`

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

`ICallback`\<[`IBrowserPage`](IBrowserPage.md)\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>\>

#### Returns

`void`

---

### getPurgeJob()

> **getPurgeJob**(`queue`, `jobId`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### jobId

`string`

##### cb

`ICallback`\<[`IBackgroundJob`](IBackgroundJob.md)\<[`TPurgeQueueJobTarget`](../type-aliases/TPurgeQueueJobTarget.md)\>\>

#### Returns

`void`

---

### getPurgeJobStatus()

> **getPurgeJobStatus**(`queue`, `jobId`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### jobId

`string`

##### cb

`ICallback`\<[`EBackgroundJobStatus`](../enumerations/EBackgroundJobStatus.md)\>

#### Returns

`void`

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
