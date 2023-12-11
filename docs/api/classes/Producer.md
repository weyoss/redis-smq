[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

## Hierarchy

- `Base`

  ↳ **`Producer`**

## Table of contents

### Constructors

- [constructor](Producer.md#constructor)

### Methods

- [getId](Producer.md#getid)
- [handleError](Producer.md#handleerror)
- [isDown](Producer.md#isdown)
- [isGoingDown](Producer.md#isgoingdown)
- [isGoingUp](Producer.md#isgoingup)
- [isRunning](Producer.md#isrunning)
- [isUp](Producer.md#isup)
- [produce](Producer.md#produce)
- [run](Producer.md#run)
- [shutdown](Producer.md#shutdown)

## Constructors

### constructor

• **new Producer**(): [`Producer`](Producer.md)

#### Returns

[`Producer`](Producer.md)

#### Inherited from

Base.constructor

## Methods

### getId

▸ **getId**(): `string`

#### Returns

`string`

#### Inherited from

Base.getId

___

### handleError

▸ **handleError**(`err`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |

#### Returns

`void`

#### Inherited from

Base.handleError

___

### isDown

▸ **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isDown

___

### isGoingDown

▸ **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isGoingDown

___

### isGoingUp

▸ **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isGoingUp

___

### isRunning

▸ **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isRunning

___

### isUp

▸ **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isUp

___

### produce

▸ **produce**(`message`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`MessageEnvelope`](Message.md) |
| `cb` | `ICallback`\<\{ `messages`: `string`[] ; `scheduled`: `boolean`  }\> |

#### Returns

`void`

___

### run

▸ **run**(`cb?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb?` | `ICallback`\<`boolean`\> |

#### Returns

`void`

#### Inherited from

Base.run

___

### shutdown

▸ **shutdown**(`cb?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb?` | `ICallback`\<`boolean`\> |

#### Returns

`void`

#### Inherited from

Base.shutdown
