[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
QueueNotEmptyError

# Class: QueueNotEmptyError

## Extends

- [`QueueManagerError`](QueueManagerError.md)

## Constructors

### Constructor

> **new QueueNotEmptyError**(`message?`): `QueueNotEmptyError`

#### Parameters

##### message?

`string`

#### Returns

`QueueNotEmptyError`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`constructor`](QueueManagerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`cause`](QueueManagerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`message`](QueueManagerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`stack`](QueueManagerError.md#stack)

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

[`QueueManagerError`](QueueManagerError.md).[`prepareStackTrace`](QueueManagerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`stackTraceLimit`](QueueManagerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`name`](QueueManagerError.md#name)

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

[`QueueManagerError`](QueueManagerError.md).[`captureStackTrace`](QueueManagerError.md#capturestacktrace)

***

### isError()

> `static` **isError**(`error`): `error is Error`

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

##### error

`unknown`

#### Returns

`error is Error`

#### Inherited from

[`QueueManagerError`](QueueManagerError.md).[`isError`](QueueManagerError.md#iserror)
