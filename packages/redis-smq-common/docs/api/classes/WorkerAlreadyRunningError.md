[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerAlreadyRunningError

# Class: WorkerAlreadyRunningError

## Extends

- [`WorkerError`](WorkerError.md)

## Constructors

### Constructor

> **new WorkerAlreadyRunningError**(): `WorkerAlreadyRunningError`

#### Returns

`WorkerAlreadyRunningError`

#### Overrides

[`WorkerError`](WorkerError.md).[`constructor`](WorkerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`WorkerError`](WorkerError.md).[`cause`](WorkerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`WorkerError`](WorkerError.md).[`message`](WorkerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`WorkerError`](WorkerError.md).[`stack`](WorkerError.md#stack)

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

[`WorkerError`](WorkerError.md).[`prepareStackTrace`](WorkerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`WorkerError`](WorkerError.md).[`stackTraceLimit`](WorkerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`WorkerError`](WorkerError.md).[`name`](WorkerError.md#name)

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

[`WorkerError`](WorkerError.md).[`captureStackTrace`](WorkerError.md#capturestacktrace)
