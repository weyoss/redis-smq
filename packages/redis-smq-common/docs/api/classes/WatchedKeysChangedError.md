[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WatchedKeysChangedError

# Class: WatchedKeysChangedError

## Extends

- [`RedisClientError`](RedisClientError.md)

## Constructors

### Constructor

> **new WatchedKeysChangedError**(`msg`): `WatchedKeysChangedError`

#### Parameters

##### msg

`string` = `'One (or more) of the watched keys has been changed'`

#### Returns

`WatchedKeysChangedError`

#### Overrides

[`RedisClientError`](RedisClientError.md).[`constructor`](RedisClientError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`RedisClientError`](RedisClientError.md).[`cause`](RedisClientError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`RedisClientError`](RedisClientError.md).[`message`](RedisClientError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`RedisClientError`](RedisClientError.md).[`stack`](RedisClientError.md#stack)

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

[`RedisClientError`](RedisClientError.md).[`prepareStackTrace`](RedisClientError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`RedisClientError`](RedisClientError.md).[`stackTraceLimit`](RedisClientError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`RedisClientError`](RedisClientError.md).[`name`](RedisClientError.md#name)

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

[`RedisClientError`](RedisClientError.md).[`captureStackTrace`](RedisClientError.md#capturestacktrace)
