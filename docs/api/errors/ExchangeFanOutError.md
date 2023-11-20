>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOutError

# Class: ExchangeFanOutError

## Hierarchy

- [`ExchangeError`](ExchangeError.md)

  ↳ **`ExchangeFanOutError`**

## Table of contents

### Constructors

- [constructor](ExchangeFanOutError.md#constructor)

### Properties

- [message](ExchangeFanOutError.md#message)
- [stack](ExchangeFanOutError.md#stack)
- [prepareStackTrace](ExchangeFanOutError.md#preparestacktrace)
- [stackTraceLimit](ExchangeFanOutError.md#stacktracelimit)

### Accessors

- [name](ExchangeFanOutError.md#name)

### Methods

- [captureStackTrace](ExchangeFanOutError.md#capturestacktrace)

## Constructors

### constructor

• **new ExchangeFanOutError**(`message?`): [`ExchangeFanOutError`](ExchangeFanOutError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ExchangeFanOutError`](ExchangeFanOutError.md)

#### Inherited from

[ExchangeError](ExchangeError.md).[constructor](ExchangeError.md#constructor)

## Properties

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
