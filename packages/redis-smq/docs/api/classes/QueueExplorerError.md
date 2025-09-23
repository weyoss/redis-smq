[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueExplorerError

# Class: QueueExplorerError

## Extends

- `RedisSMQError`

## Constructors

### Constructor

> **new QueueExplorerError**(`message?`): `QueueExplorerError`

#### Parameters

##### message?

`string`

#### Returns

`QueueExplorerError`

#### Inherited from

`RedisSMQError.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

`RedisSMQError.cause`

***

### message

> **message**: `string`

#### Inherited from

`RedisSMQError.message`

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

`RedisSMQError.stack`

***

### prepareStackTrace()?

> `static` `optional` **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Optional override for formatting stack traces

#### Parameters

##### err

`Error`

##### stackTraces

`CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

`RedisSMQError.prepareStackTrace`

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

`RedisSMQError.stackTraceLimit`

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

`RedisSMQError.name`

## Methods

### captureStackTrace()

> `static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

##### targetObject

`object`

##### constructorOpt?

`Function`

#### Returns

`void`

#### Inherited from

`RedisSMQError.captureStackTrace`
