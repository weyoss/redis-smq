[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

## Hierarchy

- `Base`

  ↳ **`Consumer`**

## Table of contents

### Constructors

- [constructor](Consumer.md#constructor)

### Methods

- [cancel](Consumer.md#cancel)
- [consume](Consumer.md#consume)
- [getId](Consumer.md#getid)
- [getQueues](Consumer.md#getqueues)
- [handleError](Consumer.md#handleerror)
- [isDown](Consumer.md#isdown)
- [isGoingDown](Consumer.md#isgoingdown)
- [isGoingUp](Consumer.md#isgoingup)
- [isRunning](Consumer.md#isrunning)
- [isUp](Consumer.md#isup)
- [run](Consumer.md#run)
- [shutdown](Consumer.md#shutdown)

## Constructors

### constructor

• **new Consumer**(`useMultiplexing?`): [`Consumer`](Consumer.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `useMultiplexing` | `boolean` | `false` |

#### Returns

[`Consumer`](Consumer.md)

#### Overrides

Base.constructor

## Methods

### cancel

▸ **cancel**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### consume

▸ **consume**(`queue`, `messageHandler`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `messageHandler` | [`TConsumerMessageHandler`](../README.md#tconsumermessagehandler) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getId

▸ **getId**(): `string`

#### Returns

`string`

#### Inherited from

Base.getId

___

### getQueues

▸ **getQueues**(): [`IQueueParams`](../interfaces/IQueueParams.md)[]

#### Returns

[`IQueueParams`](../interfaces/IQueueParams.md)[]

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
