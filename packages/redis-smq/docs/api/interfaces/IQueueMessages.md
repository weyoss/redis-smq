[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IQueueMessages

# Interface: IQueueMessages

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

`ICallback`\<[`IPaginationPage`](IPaginationPage.md)\<[`IMessageTransferable`](IMessageTransferable.md)\<`unknown`\>\>\>

#### Returns

`void`

---

### purge()

> **purge**(`queue`, `cb`): `void`

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

##### cb

`ICallback`\<`void`\>

#### Returns

`void`
