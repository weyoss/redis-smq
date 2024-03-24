[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

## Hierarchy

- `Runnable`\<[`TConsumerEvent`](../README.md#tconsumerevent)\>

  ↳ **`Consumer`**

## Table of contents

### Constructors

- [constructor](Consumer.md#constructor)

### Methods

- [cancel](Consumer.md#cancel)
- [consume](Consumer.md#consume)
- [emit](Consumer.md#emit)
- [getId](Consumer.md#getid)
- [getQueues](Consumer.md#getqueues)
- [isDown](Consumer.md#isdown)
- [isGoingDown](Consumer.md#isgoingdown)
- [isGoingUp](Consumer.md#isgoingup)
- [isRunning](Consumer.md#isrunning)
- [isUp](Consumer.md#isup)
- [on](Consumer.md#on)
- [once](Consumer.md#once)
- [removeAllListeners](Consumer.md#removealllisteners)
- [removeListener](Consumer.md#removelistener)
- [run](Consumer.md#run)
- [shutdown](Consumer.md#shutdown)

## Constructors

### constructor

• **new Consumer**(`enableMultiplexing?`): [`Consumer`](Consumer.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `enableMultiplexing?` | `boolean` |

#### Returns

[`Consumer`](Consumer.md)

#### Overrides

Runnable\&lt;TConsumerEvent\&gt;.constructor

## Methods

### cancel

▸ **cancel**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### consume

▸ **consume**(`queue`, `messageHandler`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) |
| `messageHandler` | [`TConsumerMessageHandler`](../README.md#tconsumermessagehandler) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TConsumerEvent`](../README.md#tconsumerevent)[`E`]\> |

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

### getQueues

▸ **getQueues**(): [`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

#### Returns

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

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

▸ **on**\<`E`\>(`event`, `listener`): [`Consumer`](Consumer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TConsumerEvent`](../README.md#tconsumerevent)[`E`] |

#### Returns

[`Consumer`](Consumer.md)

#### Inherited from

Runnable.on

___

### once

▸ **once**\<`E`\>(`event`, `listener`): [`Consumer`](Consumer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TConsumerEvent`](../README.md#tconsumerevent)[`E`] |

#### Returns

[`Consumer`](Consumer.md)

#### Inherited from

Runnable.once

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): [`Consumer`](Consumer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

[`Consumer`](Consumer.md)

#### Inherited from

Runnable.removeAllListeners

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): [`Consumer`](Consumer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TConsumerEvent`](../README.md#tconsumerevent)[`E`] |

#### Returns

[`Consumer`](Consumer.md)

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
