[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) / ExchangeError

# Class: ExchangeError

## Extends

- `RedisSMQError`

## Extended by

- [`MessageExchangeRequiredError`](MessageExchangeRequiredError.md)
- [`ExchangeFanoutError`](ExchangeFanoutError.md)
- [`InvalidTopicExchangeParamsError`](InvalidTopicExchangeParamsError.md)
- [`InvalidFanoutExchangeParametersError`](InvalidFanoutExchangeParametersError.md)
- [`InvalidDirectExchangeParametersError`](InvalidDirectExchangeParametersError.md)
- [`ExchangeHasBoundQueuesError`](ExchangeHasBoundQueuesError.md)
- [`QueueNotBoundError`](QueueNotBoundError.md)
- [`InvalidExchangeParametersError`](InvalidExchangeParametersError.md)
- [`ExchangeNotFoundError`](ExchangeNotFoundError.md)
- [`QueueAlreadyBound`](QueueAlreadyBound.md)

## Constructors

### Constructor

> **new ExchangeError**(`message?`): `ExchangeError`

#### Parameters

##### message?

`string`

#### Returns

`ExchangeError`

#### Inherited from

`RedisSMQError.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

`RedisSMQError.cause`

***

### message

> **message**: `string`

#### Inherited from

`RedisSMQError.message`

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

`RedisSMQError.stack`

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

`RedisSMQError.prepareStackTrace`

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

`RedisSMQError.stackTraceLimit`

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

`RedisSMQError.name`

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

`RedisSMQError.captureStackTrace`

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

`RedisSMQError.isError`
