[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerMessageExchangeRequiredError

# Class: ProducerMessageExchangeRequiredError

## Extends

- [`ProducerError`](ProducerError.md)

## Constructors

### Constructor

> **new ProducerMessageExchangeRequiredError**(`message?`): `ProducerMessageExchangeRequiredError`

#### Parameters

##### message?

`string`

#### Returns

`ProducerMessageExchangeRequiredError`

#### Inherited from

[`ProducerError`](ProducerError.md).[`constructor`](ProducerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ProducerError`](ProducerError.md).[`cause`](ProducerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ProducerError`](ProducerError.md).[`message`](ProducerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ProducerError`](ProducerError.md).[`stack`](ProducerError.md#stack)

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

[`ProducerError`](ProducerError.md).[`prepareStackTrace`](ProducerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ProducerError`](ProducerError.md).[`stackTraceLimit`](ProducerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ProducerError`](ProducerError.md).[`name`](ProducerError.md#name)

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

[`ProducerError`](ProducerError.md).[`captureStackTrace`](ProducerError.md#capturestacktrace)
