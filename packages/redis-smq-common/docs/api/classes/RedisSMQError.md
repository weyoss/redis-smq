[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisSMQError

# Abstract Class: RedisSMQError

## Extends

- `Error`

## Extended by

- [`AsyncCallbackTimeoutError`](AsyncCallbackTimeoutError.md)
- [`EventBusError`](EventBusError.md)
- [`RedisServerError`](RedisServerError.md)
- [`PanicError`](PanicError.md)
- [`AbortError`](AbortError.md)
- [`LockError`](LockError.md)
- [`LoggerError`](LoggerError.md)
- [`RedisClientError`](RedisClientError.md)
- [`InstanceLockError`](InstanceLockError.md)
- [`TimerError`](TimerError.md)
- [`WorkerError`](WorkerError.md)

## Constructors

### Constructor

> **new RedisSMQError**(`message?`): `RedisSMQError`

#### Parameters

##### message?

`string`

#### Returns

`RedisSMQError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

`Error.cause`

***

### message

> **message**: `string`

#### Inherited from

`Error.message`

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

`Error.stack`

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

`Error.prepareStackTrace`

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

`Error.stackTraceLimit`

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Overrides

`Error.name`

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

`Error.captureStackTrace`
