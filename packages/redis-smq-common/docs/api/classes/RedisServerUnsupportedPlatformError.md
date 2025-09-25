[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisServerUnsupportedPlatformError

# Class: RedisServerUnsupportedPlatformError

## Extends

- [`RedisServerError`](RedisServerError.md)

## Constructors

### Constructor

> **new RedisServerUnsupportedPlatformError**(): `RedisServerUnsupportedPlatformError`

#### Returns

`RedisServerUnsupportedPlatformError`

#### Overrides

[`RedisServerError`](RedisServerError.md).[`constructor`](RedisServerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`RedisServerError`](RedisServerError.md).[`cause`](RedisServerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`RedisServerError`](RedisServerError.md).[`message`](RedisServerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`RedisServerError`](RedisServerError.md).[`stack`](RedisServerError.md#stack)

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

[`RedisServerError`](RedisServerError.md).[`prepareStackTrace`](RedisServerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`RedisServerError`](RedisServerError.md).[`stackTraceLimit`](RedisServerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`RedisServerError`](RedisServerError.md).[`name`](RedisServerError.md#name)

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

[`RedisServerError`](RedisServerError.md).[`captureStackTrace`](RedisServerError.md#capturestacktrace)

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

[`RedisServerError`](RedisServerError.md).[`isError`](RedisServerError.md#iserror)
