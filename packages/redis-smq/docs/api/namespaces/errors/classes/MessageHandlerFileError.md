[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
MessageHandlerFileError

# Class: MessageHandlerFileError

## Extends

- [`MessageHandlerError`](MessageHandlerError.md)

## Constructors

### Constructor

> **new MessageHandlerFileError**(`message?`): `MessageHandlerFileError`

#### Parameters

##### message?

`string`

#### Returns

`MessageHandlerFileError`

#### Inherited from

[`MessageHandlerError`](MessageHandlerError.md).[`constructor`](MessageHandlerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`MessageHandlerError`](MessageHandlerError.md).[`cause`](MessageHandlerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`MessageHandlerError`](MessageHandlerError.md).[`message`](MessageHandlerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`MessageHandlerError`](MessageHandlerError.md).[`stack`](MessageHandlerError.md#stack)

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

[`MessageHandlerError`](MessageHandlerError.md).[`prepareStackTrace`](MessageHandlerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`MessageHandlerError`](MessageHandlerError.md).[`stackTraceLimit`](MessageHandlerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`MessageHandlerError`](MessageHandlerError.md).[`name`](MessageHandlerError.md#name)

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

[`MessageHandlerError`](MessageHandlerError.md).[`captureStackTrace`](MessageHandlerError.md#capturestacktrace)

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

[`MessageHandlerError`](MessageHandlerError.md).[`isError`](MessageHandlerError.md#iserror)
