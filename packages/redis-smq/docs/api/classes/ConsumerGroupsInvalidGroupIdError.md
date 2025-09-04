[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupsInvalidGroupIdError

# Class: ConsumerGroupsInvalidGroupIdError

## Extends

- [`ConsumerGroupsError`](ConsumerGroupsError.md)

## Constructors

### Constructor

> **new ConsumerGroupsInvalidGroupIdError**(`message?`): `ConsumerGroupsInvalidGroupIdError`

#### Parameters

##### message?

`string`

#### Returns

`ConsumerGroupsInvalidGroupIdError`

#### Inherited from

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`constructor`](ConsumerGroupsError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`cause`](ConsumerGroupsError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`message`](ConsumerGroupsError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`stack`](ConsumerGroupsError.md#stack)

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

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`prepareStackTrace`](ConsumerGroupsError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`stackTraceLimit`](ConsumerGroupsError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`name`](ConsumerGroupsError.md#name)

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

[`ConsumerGroupsError`](ConsumerGroupsError.md).[`captureStackTrace`](ConsumerGroupsError.md#capturestacktrace)
