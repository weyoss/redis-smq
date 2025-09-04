[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerError

# Class: ConsumerError

## Extends

- `RedisSMQError`

## Extended by

- [`ConsumerConsumeMessageHandlerAlreadyExistsError`](ConsumerConsumeMessageHandlerAlreadyExistsError.md)
- [`ConsumerConsumerGroupIdNotSupportedError`](ConsumerConsumerGroupIdNotSupportedError.md)
- [`ConsumerConsumerGroupIdRequiredError`](ConsumerConsumerGroupIdRequiredError.md)

## Constructors

### Constructor

> **new ConsumerError**(`message?`): `ConsumerError`

#### Parameters

##### message?

`string`

#### Returns

`ConsumerError`

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
