[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOutQueueTypeError

# Class: ExchangeFanOutQueueTypeError

## Extends

- [`ExchangeFanOutError`](ExchangeFanOutError.md)

## Constructors

### Constructor

> **new ExchangeFanOutQueueTypeError**(`message?`): `ExchangeFanOutQueueTypeError`

#### Parameters

##### message?

`string`

#### Returns

`ExchangeFanOutQueueTypeError`

#### Inherited from

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`constructor`](ExchangeFanOutError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`cause`](ExchangeFanOutError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`message`](ExchangeFanOutError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`stack`](ExchangeFanOutError.md#stack)

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

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`prepareStackTrace`](ExchangeFanOutError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`stackTraceLimit`](ExchangeFanOutError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`name`](ExchangeFanOutError.md#name)

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

[`ExchangeFanOutError`](ExchangeFanOutError.md).[`captureStackTrace`](ExchangeFanOutError.md#capturestacktrace)
