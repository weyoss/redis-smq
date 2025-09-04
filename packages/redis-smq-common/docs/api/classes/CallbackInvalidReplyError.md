[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / CallbackInvalidReplyError

# Class: CallbackInvalidReplyError

## Extends

- [`PanicError`](PanicError.md)

## Constructors

### Constructor

> **new CallbackInvalidReplyError**(): `CallbackInvalidReplyError`

#### Returns

`CallbackInvalidReplyError`

#### Overrides

[`PanicError`](PanicError.md).[`constructor`](PanicError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`PanicError`](PanicError.md).[`cause`](PanicError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`PanicError`](PanicError.md).[`message`](PanicError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`PanicError`](PanicError.md).[`stack`](PanicError.md#stack)

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

[`PanicError`](PanicError.md).[`prepareStackTrace`](PanicError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`PanicError`](PanicError.md).[`stackTraceLimit`](PanicError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`PanicError`](PanicError.md).[`name`](PanicError.md#name)

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

[`PanicError`](PanicError.md).[`captureStackTrace`](PanicError.md#capturestacktrace)
