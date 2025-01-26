[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeQueueIsNotBoundToExchangeError

# Class: ExchangeQueueIsNotBoundToExchangeError

## Hierarchy

- [`ExchangeError`](ExchangeError.md)

  ↳ **`ExchangeQueueIsNotBoundToExchangeError`**

## Table of contents

### Constructors

- [constructor](ExchangeQueueIsNotBoundToExchangeError.md#constructor)

### Properties

- [cause](ExchangeQueueIsNotBoundToExchangeError.md#cause)
- [message](ExchangeQueueIsNotBoundToExchangeError.md#message)
- [stack](ExchangeQueueIsNotBoundToExchangeError.md#stack)
- [prepareStackTrace](ExchangeQueueIsNotBoundToExchangeError.md#preparestacktrace)
- [stackTraceLimit](ExchangeQueueIsNotBoundToExchangeError.md#stacktracelimit)

### Accessors

- [name](ExchangeQueueIsNotBoundToExchangeError.md#name)

### Methods

- [captureStackTrace](ExchangeQueueIsNotBoundToExchangeError.md#capturestacktrace)

## Constructors

### constructor

• **new ExchangeQueueIsNotBoundToExchangeError**(`message?`): [`ExchangeQueueIsNotBoundToExchangeError`](ExchangeQueueIsNotBoundToExchangeError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ExchangeQueueIsNotBoundToExchangeError`](ExchangeQueueIsNotBoundToExchangeError.md)

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
