[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / LockError

# Class: LockError

## Extends

- [`RedisSMQError`](RedisSMQError.md)

## Extended by

- [`LockAcquireError`](LockAcquireError.md)
- [`LockExtendError`](LockExtendError.md)
- [`LockMethodNotAllowedError`](LockMethodNotAllowedError.md)
- [`LockNotAcquiredError`](LockNotAcquiredError.md)

## Constructors

### Constructor

> **new LockError**(`message?`): `LockError`

#### Parameters

##### message?

`string`

#### Returns

`LockError`

#### Inherited from

[`RedisSMQError`](RedisSMQError.md).[`constructor`](RedisSMQError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`RedisSMQError`](RedisSMQError.md).[`cause`](RedisSMQError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`RedisSMQError`](RedisSMQError.md).[`message`](RedisSMQError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`RedisSMQError`](RedisSMQError.md).[`stack`](RedisSMQError.md#stack)

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

[`RedisSMQError`](RedisSMQError.md).[`prepareStackTrace`](RedisSMQError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`RedisSMQError`](RedisSMQError.md).[`stackTraceLimit`](RedisSMQError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`RedisSMQError`](RedisSMQError.md).[`name`](RedisSMQError.md#name)

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

[`RedisSMQError`](RedisSMQError.md).[`captureStackTrace`](RedisSMQError.md#capturestacktrace)

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

[`RedisSMQError`](RedisSMQError.md).[`isError`](RedisSMQError.md#iserror)
