[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeQueueIsNotBoundToExchangeError

# Class: ExchangeQueueIsNotBoundToExchangeError

## Extends

- [`ExchangeError`](ExchangeError.md)

## Constructors

### Constructor

> **new ExchangeQueueIsNotBoundToExchangeError**(`message?`): `ExchangeQueueIsNotBoundToExchangeError`

#### Parameters

##### message?

`string`

#### Returns

`ExchangeQueueIsNotBoundToExchangeError`

#### Inherited from

[`ExchangeError`](ExchangeError.md).[`constructor`](ExchangeError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ExchangeError`](ExchangeError.md).[`cause`](ExchangeError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ExchangeError`](ExchangeError.md).[`message`](ExchangeError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ExchangeError`](ExchangeError.md).[`stack`](ExchangeError.md#stack)

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

[`ExchangeError`](ExchangeError.md).[`prepareStackTrace`](ExchangeError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ExchangeError`](ExchangeError.md).[`stackTraceLimit`](ExchangeError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ExchangeError`](ExchangeError.md).[`name`](ExchangeError.md#name)

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

[`ExchangeError`](ExchangeError.md).[`captureStackTrace`](ExchangeError.md#capturestacktrace)
