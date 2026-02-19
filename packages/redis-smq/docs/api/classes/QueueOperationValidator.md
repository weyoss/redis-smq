[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueOperationValidator

# Class: QueueOperationValidator

## Constructors

### Constructor

> **new QueueOperationValidator**(): `QueueOperationValidator`

#### Returns

`QueueOperationValidator`

## Methods

### checkOperations()

> `static` **checkOperations**(`queueParams`, `operations`, `cb`): `void`

#### Parameters

##### queueParams

[`IQueueParams`](../interfaces/IQueueParams.md)

##### operations

[`EQueueOperation`](../enumerations/EQueueOperation.md)[]

##### cb

`ICallback`\<`boolean`[]\>

#### Returns

`void`

---

### validateOperation()

> `static` **validateOperation**(`queueParams`, `operation`, `cb`): `void`

#### Parameters

##### queueParams

[`IQueueParams`](../interfaces/IQueueParams.md)

##### operation

[`EQueueOperation`](../enumerations/EQueueOperation.md)

##### cb

`ICallback`

#### Returns

`void`
