[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) / InvalidRateLimitError

# Class: InvalidRateLimitError

## Extends

- [`QueueRateLimitError`](QueueRateLimitError.md)

## Constructors

### Constructor

> **new InvalidRateLimitError**(`message?`): `InvalidRateLimitError`

#### Parameters

##### message?

`string`

#### Returns

`InvalidRateLimitError`

#### Inherited from

[`QueueRateLimitError`](QueueRateLimitError.md).[`constructor`](QueueRateLimitError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`QueueRateLimitError`](QueueRateLimitError.md).[`cause`](QueueRateLimitError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`QueueRateLimitError`](QueueRateLimitError.md).[`message`](QueueRateLimitError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`QueueRateLimitError`](QueueRateLimitError.md).[`stack`](QueueRateLimitError.md#stack)

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

[`QueueRateLimitError`](QueueRateLimitError.md).[`prepareStackTrace`](QueueRateLimitError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`QueueRateLimitError`](QueueRateLimitError.md).[`stackTraceLimit`](QueueRateLimitError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`QueueRateLimitError`](QueueRateLimitError.md).[`name`](QueueRateLimitError.md#name)

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

[`QueueRateLimitError`](QueueRateLimitError.md).[`captureStackTrace`](QueueRateLimitError.md#capturestacktrace)

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

[`QueueRateLimitError`](QueueRateLimitError.md).[`isError`](QueueRateLimitError.md#iserror)
