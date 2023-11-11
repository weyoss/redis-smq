[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

## Contents

- [Constructors](Producer.md#constructors)
  - [new Producer()](Producer.md#new-producer)
- [Methods](Producer.md#methods)
  - [getId()](Producer.md#getid)
  - [handleError()](Producer.md#handleerror)
  - [isDown()](Producer.md#isdown)
  - [isGoingDown()](Producer.md#isgoingdown)
  - [isGoingUp()](Producer.md#isgoingup)
  - [isRunning()](Producer.md#isrunning)
  - [isUp()](Producer.md#isup)
  - [produce()](Producer.md#produce)
  - [run()](Producer.md#run)
  - [shutdown()](Producer.md#shutdown)

## Constructors

### new Producer()

> **new Producer**(): [`Producer`](Producer.md)

#### Returns

[`Producer`](Producer.md)

## Methods

### getId()

> **getId**(): `string`

#### Returns

`string`

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

### produce()

> **produce**(`message`, `cb`): `void`

#### Parameters

▪ **message**: [`Message`](Message.md)

▪ **cb**: `ICallback`<`object`>

#### Returns

`void`

***

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

