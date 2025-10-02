[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) / RedisKeysInvalidKeyError

# Class: RedisKeysInvalidKeyError

## Extends

- [`RedisKeysError`](RedisKeysError.md)

## Constructors

### Constructor

> **new RedisKeysInvalidKeyError**(`message?`): `RedisKeysInvalidKeyError`

#### Parameters

##### message?

`string`

#### Returns

`RedisKeysInvalidKeyError`

#### Inherited from

[`RedisKeysError`](RedisKeysError.md).[`constructor`](RedisKeysError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`RedisKeysError`](RedisKeysError.md).[`cause`](RedisKeysError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`RedisKeysError`](RedisKeysError.md).[`message`](RedisKeysError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`RedisKeysError`](RedisKeysError.md).[`stack`](RedisKeysError.md#stack)

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

[`RedisKeysError`](RedisKeysError.md).[`prepareStackTrace`](RedisKeysError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`RedisKeysError`](RedisKeysError.md).[`stackTraceLimit`](RedisKeysError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`RedisKeysError`](RedisKeysError.md).[`name`](RedisKeysError.md#name)

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

[`RedisKeysError`](RedisKeysError.md).[`captureStackTrace`](RedisKeysError.md#capturestacktrace)

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

[`RedisKeysError`](RedisKeysError.md).[`isError`](RedisKeysError.md#iserror)
