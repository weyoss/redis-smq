[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) / MessageNotFoundError

# Class: MessageNotFoundError

## Extends

- [`MessageManagerError`](MessageManagerError.md)

## Constructors

### Constructor

> **new MessageNotFoundError**(`message?`): `MessageNotFoundError`

#### Parameters

##### message?

`string`

#### Returns

`MessageNotFoundError`

#### Inherited from

[`MessageManagerError`](MessageManagerError.md).[`constructor`](MessageManagerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`MessageManagerError`](MessageManagerError.md).[`cause`](MessageManagerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`MessageManagerError`](MessageManagerError.md).[`message`](MessageManagerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`MessageManagerError`](MessageManagerError.md).[`stack`](MessageManagerError.md#stack)

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

[`MessageManagerError`](MessageManagerError.md).[`prepareStackTrace`](MessageManagerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`MessageManagerError`](MessageManagerError.md).[`stackTraceLimit`](MessageManagerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`MessageManagerError`](MessageManagerError.md).[`name`](MessageManagerError.md#name)

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

[`MessageManagerError`](MessageManagerError.md).[`captureStackTrace`](MessageManagerError.md#capturestacktrace)

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

[`MessageManagerError`](MessageManagerError.md).[`isError`](MessageManagerError.md#iserror)
