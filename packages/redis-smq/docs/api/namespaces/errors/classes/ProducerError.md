[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
ProducerError

# Class: ProducerError

## Extends

- `RedisSMQError`

## Extended by

- [`ProducerNotRunningError`](ProducerNotRunningError.md)
- [`QueueHasNoConsumerGroupsError`](QueueHasNoConsumerGroupsError.md)
- [`MessagePriorityRequiredError`](MessagePriorityRequiredError.md)
- [`PriorityQueuingNotEnabledError`](PriorityQueuingNotEnabledError.md)
- [`NoMatchedQueueForExchangeError`](NoMatchedQueueForExchangeError.md)
- [`InvalidSchedulingParametersError`](InvalidSchedulingParametersError.md)
- [`MessageAlreadyExistsError`](MessageAlreadyExistsError.md)

## Constructors

### Constructor

> **new ProducerError**(`message?`): `ProducerError`

#### Parameters

##### message?

`string`

#### Returns

`ProducerError`

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
