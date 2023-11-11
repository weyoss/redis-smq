[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

## Contents

- [Constructors](Consumer.md#constructors)
  - [new Consumer(useMultiplexing)](Consumer.md#new-consumerusemultiplexing)
- [Methods](Consumer.md#methods)
  - [cancel()](Consumer.md#cancel)
  - [consume()](Consumer.md#consume)
  - [getId()](Consumer.md#getid)
  - [getQueues()](Consumer.md#getqueues)
  - [handleError()](Consumer.md#handleerror)
  - [isDown()](Consumer.md#isdown)
  - [isGoingDown()](Consumer.md#isgoingdown)
  - [isGoingUp()](Consumer.md#isgoingup)
  - [isRunning()](Consumer.md#isrunning)
  - [isUp()](Consumer.md#isup)
  - [run()](Consumer.md#run)
  - [shutdown()](Consumer.md#shutdown)

## Constructors

### new Consumer(useMultiplexing)

> **new Consumer**(`useMultiplexing`): [`Consumer`](Consumer.md)

#### Parameters

▪ **useMultiplexing**: `boolean`= `false`

#### Returns

[`Consumer`](Consumer.md)

#### Overrides

Base.constructor

## Methods

### cancel()

> **cancel**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### consume()

> **consume**(`queue`, `messageHandler`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **messageHandler**: [`TConsumerMessageHandler`](../type-aliases/TConsumerMessageHandler.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### getId()

> **getId**(): `string`

#### Returns

`string`

### getQueues()

> **getQueues**(): [`IQueueParams`](../interfaces/IQueueParams.md)[]

#### Returns

[`IQueueParams`](../interfaces/IQueueParams.md)[]

***

### handleError()

> **handleError**(`err`): `void`

#### Parameters

▪ **err**: `Error`

#### Returns

`void`

### isDown()

> **isDown**(): `boolean`

#### Returns

`boolean`

### isGoingDown()

> **isGoingDown**(): `boolean`

#### Returns

`boolean`

### isGoingUp()

> **isGoingUp**(): `boolean`

#### Returns

`boolean`

### isRunning()

> **isRunning**(): `boolean`

#### Returns

`boolean`

### isUp()

> **isUp**(): `boolean`

#### Returns

`boolean`

### run()

> **run**(`cb`?): `void`

#### Parameters

▪ **cb?**: `ICallback`<`boolean`>

#### Returns

`void`

### shutdown()

> **shutdown**(`cb`?): `void`

#### Parameters

▪ **cb?**: `ICallback`<`boolean`>

#### Returns

`void`

