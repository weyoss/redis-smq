[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueQueueNotEmptyError

# Class: QueueQueueNotEmptyError

## Extends

- [`QueueError`](QueueError.md)

## Constructors

### Constructor

> **new QueueQueueNotEmptyError**(`message?`): `QueueQueueNotEmptyError`

#### Parameters

##### message?

`string`

#### Returns

`QueueQueueNotEmptyError`

#### Inherited from

[`QueueError`](QueueError.md).[`constructor`](QueueError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`QueueError`](QueueError.md).[`cause`](QueueError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`QueueError`](QueueError.md).[`message`](QueueError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`QueueError`](QueueError.md).[`stack`](QueueError.md#stack)

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

[`QueueError`](QueueError.md).[`prepareStackTrace`](QueueError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`QueueError`](QueueError.md).[`stackTraceLimit`](QueueError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`QueueError`](QueueError.md).[`name`](QueueError.md#name)

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

[`QueueError`](QueueError.md).[`captureStackTrace`](QueueError.md#capturestacktrace)
