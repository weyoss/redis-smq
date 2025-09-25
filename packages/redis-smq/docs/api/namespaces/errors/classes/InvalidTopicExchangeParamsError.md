[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
InvalidTopicExchangeParamsError

# Class: InvalidTopicExchangeParamsError

## Extends

- [`MessageExchangeError`](MessageExchangeError.md)

## Constructors

### Constructor

> **new InvalidTopicExchangeParamsError**(`message?`): `InvalidTopicExchangeParamsError`

#### Parameters

##### message?

`string`

#### Returns

`InvalidTopicExchangeParamsError`

#### Inherited from

[`MessageExchangeError`](MessageExchangeError.md).[`constructor`](MessageExchangeError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`MessageExchangeError`](MessageExchangeError.md).[`cause`](MessageExchangeError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`MessageExchangeError`](MessageExchangeError.md).[`message`](MessageExchangeError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`MessageExchangeError`](MessageExchangeError.md).[`stack`](MessageExchangeError.md#stack)

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

[`MessageExchangeError`](MessageExchangeError.md).[`prepareStackTrace`](MessageExchangeError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`MessageExchangeError`](MessageExchangeError.md).[`stackTraceLimit`](MessageExchangeError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`MessageExchangeError`](MessageExchangeError.md).[`name`](MessageExchangeError.md#name)

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

[`MessageExchangeError`](MessageExchangeError.md).[`captureStackTrace`](MessageExchangeError.md#capturestacktrace)

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

[`MessageExchangeError`](MessageExchangeError.md).[`isError`](MessageExchangeError.md#iserror)
