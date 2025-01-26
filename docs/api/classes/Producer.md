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

• **new Producer**(): [`Producer`](Producer.md)

#### Returns

[`Producer`](Producer.md)

#### Overrides

Runnable\<TProducerEvent\>.constructor

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

▸ **on**\<`E`\>(`event`, `listener`): `this`

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

`this`

#### Inherited from

Runnable.on

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

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

`this`

#### Inherited from

Runnable.once

___

### produce

▸ **produce**(`msg`, `cb`): `void`

Produce a message.

Before publishing a message make sure to set an exchange for the message and to have at least one existing queue to be matched.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msg` | [`ProducibleMessage`](ProducibleMessage.md) | A message to produce. |
| `cb` | `ICallback`\<`string`[]\> | Callback function that accepts an array of message IDs that has been published. |

#### Returns

`void`

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/producing-messages.md

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Inherited from

Runnable.removeAllListeners

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

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

`this`

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
