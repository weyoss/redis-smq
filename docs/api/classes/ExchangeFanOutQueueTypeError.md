[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOutQueueTypeError

# Class: ExchangeFanOutQueueTypeError

## Hierarchy

- [`ExchangeFanOutError`](ExchangeFanOutError.md)

  ↳ **`ExchangeFanOutQueueTypeError`**

## Table of contents

### Constructors

- [constructor](ExchangeFanOutQueueTypeError.md#constructor)

### Properties

- [cause](ExchangeFanOutQueueTypeError.md#cause)
- [message](ExchangeFanOutQueueTypeError.md#message)
- [stack](ExchangeFanOutQueueTypeError.md#stack)
- [prepareStackTrace](ExchangeFanOutQueueTypeError.md#preparestacktrace)
- [stackTraceLimit](ExchangeFanOutQueueTypeError.md#stacktracelimit)

### Accessors

- [name](ExchangeFanOutQueueTypeError.md#name)

### Methods

- [captureStackTrace](ExchangeFanOutQueueTypeError.md#capturestacktrace)

## Constructors

### constructor

• **new ExchangeFanOutQueueTypeError**(`message?`): [`ExchangeFanOutQueueTypeError`](ExchangeFanOutQueueTypeError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ExchangeFanOutQueueTypeError`](ExchangeFanOutQueueTypeError.md)

#### Inherited from

[ExchangeFanOutError](ExchangeFanOutError.md).[constructor](ExchangeFanOutError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ExchangeFanOutError](ExchangeFanOutError.md).[cause](ExchangeFanOutError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ExchangeFanOutError](ExchangeFanOutError.md).[message](ExchangeFanOutError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ExchangeFanOutError](ExchangeFanOutError.md).[stack](ExchangeFanOutError.md#stack)

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

[ExchangeFanOutError](ExchangeFanOutError.md).[prepareStackTrace](ExchangeFanOutError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ExchangeFanOutError](ExchangeFanOutError.md).[stackTraceLimit](ExchangeFanOutError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ExchangeFanOutError.name

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

[ExchangeFanOutError](ExchangeFanOutError.md).[captureStackTrace](ExchangeFanOutError.md#capturestacktrace)
