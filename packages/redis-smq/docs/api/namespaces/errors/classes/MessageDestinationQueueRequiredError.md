[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
MessageDestinationQueueRequiredError

# Class: MessageDestinationQueueRequiredError

## Extends

- [`MessageError`](MessageError.md)

## Constructors

### Constructor

> **new MessageDestinationQueueRequiredError**(`message?`): `MessageDestinationQueueRequiredError`

#### Parameters

##### message?

`string`

#### Returns

`MessageDestinationQueueRequiredError`

#### Inherited from

[`MessageError`](MessageError.md).[`constructor`](MessageError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`MessageError`](MessageError.md).[`cause`](MessageError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`MessageError`](MessageError.md).[`message`](MessageError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`MessageError`](MessageError.md).[`stack`](MessageError.md#stack)

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

[`MessageError`](MessageError.md).[`prepareStackTrace`](MessageError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`MessageError`](MessageError.md).[`stackTraceLimit`](MessageError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`MessageError`](MessageError.md).[`name`](MessageError.md#name)

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

[`MessageError`](MessageError.md).[`captureStackTrace`](MessageError.md#capturestacktrace)

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

[`MessageError`](MessageError.md).[`isError`](MessageError.md#iserror)
