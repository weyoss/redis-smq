[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueOperationValidator

# Class: QueueOperationValidator

## Constructors

### Constructor

> **new QueueOperationValidator**(): `QueueOperationValidator`

#### Returns

`QueueOperationValidator`

## Methods

### canBindExchange()

> `static` **canBindExchange**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canClearRateLimit()

> `static` **canClearRateLimit**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canConsume()

> `static` **canConsume**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canCreateConsumerGroup()

> `static` **canCreateConsumerGroup**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canDelete()

> `static` **canDelete**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canDeleteConsumerGroup()

> `static` **canDeleteConsumerGroup**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canDeleteMessage()

> `static` **canDeleteMessage**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canProduce()

> `static` **canProduce**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canPurge()

> `static` **canPurge**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canRequeue()

> `static` **canRequeue**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canSetRateLimit()

> `static` **canSetRateLimit**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`

---

### canUnbindExchange()

> `static` **canUnbindExchange**(`queue`, `cb`): `void`

#### Parameters

##### queue

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

#### Returns

`void`
