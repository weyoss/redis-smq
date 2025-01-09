[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

## Hierarchy

- `Runnable`\<[`TProducerEvent`](../README.md#tproducerevent)\>

  ↳ **`Producer`**

## Table of contents

### Constructors

- [constructor](Producer.md#constructor)

### Methods

- [emit](Producer.md#emit)
- [getId](Producer.md#getid)
- [isDown](Producer.md#isdown)
- [isGoingDown](Producer.md#isgoingdown)
- [isGoingUp](Producer.md#isgoingup)
- [isRunning](Producer.md#isrunning)
- [isUp](Producer.md#isup)
- [on](Producer.md#on)
- [once](Producer.md#once)
- [produce](Producer.md#produce)
- [removeAllListeners](Producer.md#removealllisteners)
- [removeListener](Producer.md#removelistener)
- [run](Producer.md#run)
- [shutdown](Producer.md#shutdown)

## Constructors

### constructor

• **new Producer**()

#### Overrides

Runnable\&lt;TProducerEvent\&gt;.constructor

## Methods

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TProducerEvent`](../README.md#tproducerevent)[`E`]\> |

#### Returns

`boolean`

#### Inherited from

Runnable.emit

___

### getId

▸ **getId**(): `string`

#### Returns

`string`

#### Inherited from

Runnable.getId

___

### isDown

▸ **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isDown

___

### isGoingDown

▸ **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isGoingDown

___

### isGoingUp

▸ **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isGoingUp

___

### isRunning

▸ **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isRunning

___

### isUp

▸ **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isUp

___

### on

▸ **on**\<`E`\>(`event`, `listener`): [`Producer`](Producer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TProducerEvent`](../README.md#tproducerevent)[`E`] |

#### Returns

[`Producer`](Producer.md)

#### Inherited from

Runnable.on

___

### once

▸ **once**\<`E`\>(`event`, `listener`): [`Producer`](Producer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TProducerEvent`](../README.md#tproducerevent)[`E`] |

#### Returns

[`Producer`](Producer.md)

#### Inherited from

Runnable.once

___

### produce

▸ **produce**(`msg`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`ProducibleMessage`](ProducibleMessage.md) |
| `cb` | `ICallback`\<`string`[]\> |

#### Returns

`void`

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): [`Producer`](Producer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

[`Producer`](Producer.md)

#### Inherited from

Runnable.removeAllListeners

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): [`Producer`](Producer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TProducerEvent`](../README.md#tproducerevent)[`E`] |

#### Returns

[`Producer`](Producer.md)

#### Inherited from

Runnable.removeListener

___

### run

▸ **run**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`boolean`\> |

#### Returns

`void`

#### Inherited from

Runnable.run

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

Runnable.shutdown
