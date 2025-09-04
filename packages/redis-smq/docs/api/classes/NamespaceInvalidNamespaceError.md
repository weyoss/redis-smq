[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / NamespaceInvalidNamespaceError

# Class: NamespaceInvalidNamespaceError

## Extends

- [`NamespaceError`](NamespaceError.md)

## Constructors

### Constructor

> **new NamespaceInvalidNamespaceError**(`message?`): `NamespaceInvalidNamespaceError`

#### Parameters

##### message?

`string`

#### Returns

`NamespaceInvalidNamespaceError`

#### Inherited from

[`NamespaceError`](NamespaceError.md).[`constructor`](NamespaceError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`NamespaceError`](NamespaceError.md).[`cause`](NamespaceError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`NamespaceError`](NamespaceError.md).[`message`](NamespaceError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`NamespaceError`](NamespaceError.md).[`stack`](NamespaceError.md#stack)

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

[`NamespaceError`](NamespaceError.md).[`prepareStackTrace`](NamespaceError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`NamespaceError`](NamespaceError.md).[`stackTraceLimit`](NamespaceError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`NamespaceError`](NamespaceError.md).[`name`](NamespaceError.md#name)

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

[`NamespaceError`](NamespaceError.md).[`captureStackTrace`](NamespaceError.md#capturestacktrace)
