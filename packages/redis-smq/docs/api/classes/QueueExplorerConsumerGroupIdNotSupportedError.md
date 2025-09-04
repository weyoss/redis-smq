[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueExplorerConsumerGroupIdNotSupportedError

# Class: QueueExplorerConsumerGroupIdNotSupportedError

## Extends

- [`QueueExplorerError`](QueueExplorerError.md)

## Constructors

### Constructor

> **new QueueExplorerConsumerGroupIdNotSupportedError**(`message?`): `QueueExplorerConsumerGroupIdNotSupportedError`

#### Parameters

##### message?

`string`

#### Returns

`QueueExplorerConsumerGroupIdNotSupportedError`

#### Inherited from

[`QueueExplorerError`](QueueExplorerError.md).[`constructor`](QueueExplorerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`QueueExplorerError`](QueueExplorerError.md).[`cause`](QueueExplorerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`QueueExplorerError`](QueueExplorerError.md).[`message`](QueueExplorerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`QueueExplorerError`](QueueExplorerError.md).[`stack`](QueueExplorerError.md#stack)

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

[`QueueExplorerError`](QueueExplorerError.md).[`prepareStackTrace`](QueueExplorerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`QueueExplorerError`](QueueExplorerError.md).[`stackTraceLimit`](QueueExplorerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`QueueExplorerError`](QueueExplorerError.md).[`name`](QueueExplorerError.md#name)

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

[`QueueExplorerError`](QueueExplorerError.md).[`captureStackTrace`](QueueExplorerError.md#capturestacktrace)
