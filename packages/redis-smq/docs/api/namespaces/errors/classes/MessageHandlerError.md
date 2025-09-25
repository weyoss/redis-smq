[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
MessageHandlerError

# Class: MessageHandlerError

## Extends

- [`ConsumerError`](ConsumerError.md)

## Extended by

- [`MessageHandlerFilenameExtensionError`](MessageHandlerFilenameExtensionError.md)
- [`MessageHandlerFileError`](MessageHandlerFileError.md)
- [`ConsumerGroupNotFoundError`](ConsumerGroupNotFoundError.md)

## Constructors

### Constructor

> **new MessageHandlerError**(`message?`): `MessageHandlerError`

#### Parameters

##### message?

`string`

#### Returns

`MessageHandlerError`

#### Inherited from

[`ConsumerError`](ConsumerError.md).[`constructor`](ConsumerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ConsumerError`](ConsumerError.md).[`cause`](ConsumerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ConsumerError`](ConsumerError.md).[`message`](ConsumerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ConsumerError`](ConsumerError.md).[`stack`](ConsumerError.md#stack)

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

[`ConsumerError`](ConsumerError.md).[`prepareStackTrace`](ConsumerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ConsumerError`](ConsumerError.md).[`stackTraceLimit`](ConsumerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ConsumerError`](ConsumerError.md).[`name`](ConsumerError.md#name)

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

[`ConsumerError`](ConsumerError.md).[`captureStackTrace`](ConsumerError.md#capturestacktrace)

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

[`ConsumerError`](ConsumerError.md).[`isError`](ConsumerError.md#iserror)
