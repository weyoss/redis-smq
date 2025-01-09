[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimitInvalidLimitError

# Class: QueueRateLimitInvalidLimitError

## Hierarchy

- [`QueueRateLimitError`](QueueRateLimitError.md)

  ↳ **`QueueRateLimitInvalidLimitError`**

## Table of contents

### Constructors

- [constructor](QueueRateLimitInvalidLimitError.md#constructor)

### Properties

- [cause](QueueRateLimitInvalidLimitError.md#cause)
- [message](QueueRateLimitInvalidLimitError.md#message)
- [stack](QueueRateLimitInvalidLimitError.md#stack)
- [prepareStackTrace](QueueRateLimitInvalidLimitError.md#preparestacktrace)
- [stackTraceLimit](QueueRateLimitInvalidLimitError.md#stacktracelimit)

### Accessors

- [name](QueueRateLimitInvalidLimitError.md#name)

### Methods

- [captureStackTrace](QueueRateLimitInvalidLimitError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueRateLimitInvalidLimitError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

[QueueRateLimitError](QueueRateLimitError.md).[constructor](QueueRateLimitError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[QueueRateLimitError](QueueRateLimitError.md).[cause](QueueRateLimitError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[QueueRateLimitError](QueueRateLimitError.md).[message](QueueRateLimitError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[QueueRateLimitError](QueueRateLimitError.md).[stack](QueueRateLimitError.md#stack)

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

[QueueRateLimitError](QueueRateLimitError.md).[prepareStackTrace](QueueRateLimitError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[QueueRateLimitError](QueueRateLimitError.md).[stackTraceLimit](QueueRateLimitError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

QueueRateLimitError.name

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

[QueueRateLimitError](QueueRateLimitError.md).[captureStackTrace](QueueRateLimitError.md#capturestacktrace)
