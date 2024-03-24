[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeInvalidDataError

# Class: ExchangeInvalidDataError

## Hierarchy

- [`ExchangeError`](ExchangeError.md)

  ↳ **`ExchangeInvalidDataError`**

## Table of contents

### Constructors

- [constructor](ExchangeInvalidDataError.md#constructor)

### Properties

- [cause](ExchangeInvalidDataError.md#cause)
- [message](ExchangeInvalidDataError.md#message)
- [stack](ExchangeInvalidDataError.md#stack)
- [prepareStackTrace](ExchangeInvalidDataError.md#preparestacktrace)
- [stackTraceLimit](ExchangeInvalidDataError.md#stacktracelimit)

### Accessors

- [name](ExchangeInvalidDataError.md#name)

### Methods

- [captureStackTrace](ExchangeInvalidDataError.md#capturestacktrace)

## Constructors

### constructor

• **new ExchangeInvalidDataError**(`message?`): [`ExchangeInvalidDataError`](ExchangeInvalidDataError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ExchangeInvalidDataError`](ExchangeInvalidDataError.md)

#### Inherited from

[ExchangeError](ExchangeError.md).[constructor](ExchangeError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ExchangeError](ExchangeError.md).[cause](ExchangeError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ExchangeError](ExchangeError.md).[message](ExchangeError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ExchangeError](ExchangeError.md).[stack](ExchangeError.md#stack)

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[ExchangeError](ExchangeError.md).[prepareStackTrace](ExchangeError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ExchangeError](ExchangeError.md).[stackTraceLimit](ExchangeError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ExchangeError.name

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[ExchangeError](ExchangeError.md).[captureStackTrace](ExchangeError.md#capturestacktrace)
