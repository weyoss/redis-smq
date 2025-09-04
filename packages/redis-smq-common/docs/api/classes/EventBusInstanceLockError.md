[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusInstanceLockError

# Class: EventBusInstanceLockError

## Extends

- [`EventBusError`](EventBusError.md)

## Constructors

### Constructor

> **new EventBusInstanceLockError**(`message?`): `EventBusInstanceLockError`

#### Parameters

##### message?

`string`

#### Returns

`EventBusInstanceLockError`

#### Inherited from

[`EventBusError`](EventBusError.md).[`constructor`](EventBusError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`EventBusError`](EventBusError.md).[`cause`](EventBusError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`EventBusError`](EventBusError.md).[`message`](EventBusError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`EventBusError`](EventBusError.md).[`stack`](EventBusError.md#stack)

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

[`EventBusError`](EventBusError.md).[`prepareStackTrace`](EventBusError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`EventBusError`](EventBusError.md).[`stackTraceLimit`](EventBusError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`EventBusError`](EventBusError.md).[`name`](EventBusError.md#name)

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

[`EventBusError`](EventBusError.md).[`captureStackTrace`](EventBusError.md#capturestacktrace)
