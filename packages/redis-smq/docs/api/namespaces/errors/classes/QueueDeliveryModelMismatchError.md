[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
QueueDeliveryModelMismatchError

# Class: QueueDeliveryModelMismatchError

## Extends

- [`ExchangeFanoutError`](ExchangeFanoutError.md)

## Constructors

### Constructor

> **new QueueDeliveryModelMismatchError**(`message?`): `QueueDeliveryModelMismatchError`

#### Parameters

##### message?

`string`

#### Returns

`QueueDeliveryModelMismatchError`

#### Inherited from

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`constructor`](ExchangeFanoutError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`cause`](ExchangeFanoutError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`message`](ExchangeFanoutError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`stack`](ExchangeFanoutError.md#stack)

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

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`prepareStackTrace`](ExchangeFanoutError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`stackTraceLimit`](ExchangeFanoutError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`name`](ExchangeFanoutError.md#name)

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

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`captureStackTrace`](ExchangeFanoutError.md#capturestacktrace)

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

[`ExchangeFanoutError`](ExchangeFanoutError.md).[`isError`](ExchangeFanoutError.md#iserror)
