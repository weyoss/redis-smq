[RedisSMQ](../../../../../README.md) / [Docs](../../../../README.md) / [API Reference](../../../README.md) / [errors](../README.md) / ConfigurationNamespaceError

# Class: ConfigurationNamespaceError

## Extends

- [`ConfigurationError`](ConfigurationError.md)

## Constructors

### Constructor

> **new ConfigurationNamespaceError**(`message?`): `ConfigurationNamespaceError`

#### Parameters

##### message?

`string`

#### Returns

`ConfigurationNamespaceError`

#### Inherited from

[`ConfigurationError`](ConfigurationError.md).[`constructor`](ConfigurationError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ConfigurationError`](ConfigurationError.md).[`cause`](ConfigurationError.md#cause)

***

### message

> **message**: `string`

#### Inherited from

[`ConfigurationError`](ConfigurationError.md).[`message`](ConfigurationError.md#message)

***

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ConfigurationError`](ConfigurationError.md).[`stack`](ConfigurationError.md#stack)

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

[`ConfigurationError`](ConfigurationError.md).[`prepareStackTrace`](ConfigurationError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ConfigurationError`](ConfigurationError.md).[`stackTraceLimit`](ConfigurationError.md#stacktracelimit)

## Accessors

### name

#### Get Signature

> **get** **name**(): `string`

##### Returns

`string`

#### Inherited from

[`ConfigurationError`](ConfigurationError.md).[`name`](ConfigurationError.md#name)

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

[`ConfigurationError`](ConfigurationError.md).[`captureStackTrace`](ConfigurationError.md#capturestacktrace)

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

[`ConfigurationError`](ConfigurationError.md).[`isError`](ConfigurationError.md#iserror)
