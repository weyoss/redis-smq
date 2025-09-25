[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) /
NamespaceNotFoundError

# Class: NamespaceNotFoundError

## Extends

- [`NamespaceManagerError`](NamespaceManagerError.md)

## Constructors

### Constructor

> **new NamespaceNotFoundError**(`message?`): `NamespaceNotFoundError`

#### Parameters

##### message?

`string`

#### Returns

`NamespaceNotFoundError`

#### Inherited from

[`NamespaceManagerError`](NamespaceManagerError.md).[`constructor`](NamespaceManagerError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`NamespaceManagerError`](NamespaceManagerError.md).[`cause`](NamespaceManagerError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`NamespaceManagerError`](NamespaceManagerError.md).[`message`](NamespaceManagerError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`NamespaceManagerError`](NamespaceManagerError.md).[`stack`](NamespaceManagerError.md#stack)

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

[`NamespaceManagerError`](NamespaceManagerError.md).[`prepareStackTrace`](NamespaceManagerError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`NamespaceManagerError`](NamespaceManagerError.md).[`stackTraceLimit`](NamespaceManagerError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`NamespaceManagerError`](NamespaceManagerError.md).[`name`](NamespaceManagerError.md#name)

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

[`NamespaceManagerError`](NamespaceManagerError.md).[`captureStackTrace`](NamespaceManagerError.md#capturestacktrace)

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

[`NamespaceManagerError`](NamespaceManagerError.md).[`isError`](NamespaceManagerError.md#iserror)
