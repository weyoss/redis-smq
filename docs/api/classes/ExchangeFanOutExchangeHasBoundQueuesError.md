[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOutExchangeHasBoundQueuesError

# Class: ExchangeFanOutExchangeHasBoundQueuesError

## Hierarchy

- [`ExchangeError`](ExchangeError.md)

  ↳ **`ExchangeFanOutExchangeHasBoundQueuesError`**

## Table of contents

### Constructors

- [constructor](ExchangeFanOutExchangeHasBoundQueuesError.md#constructor)

### Properties

- [cause](ExchangeFanOutExchangeHasBoundQueuesError.md#cause)
- [message](ExchangeFanOutExchangeHasBoundQueuesError.md#message)
- [stack](ExchangeFanOutExchangeHasBoundQueuesError.md#stack)
- [prepareStackTrace](ExchangeFanOutExchangeHasBoundQueuesError.md#preparestacktrace)
- [stackTraceLimit](ExchangeFanOutExchangeHasBoundQueuesError.md#stacktracelimit)

### Accessors

- [name](ExchangeFanOutExchangeHasBoundQueuesError.md#name)

### Methods

- [captureStackTrace](ExchangeFanOutExchangeHasBoundQueuesError.md#capturestacktrace)

## Constructors

### constructor

• **new ExchangeFanOutExchangeHasBoundQueuesError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

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

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

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
