[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimitQueueNotFoundError

# Class: QueueRateLimitQueueNotFoundError

## Hierarchy

- [`QueueRateLimitError`](QueueRateLimitError.md)

  ↳ **`QueueRateLimitQueueNotFoundError`**

## Table of contents

### Constructors

- [constructor](QueueRateLimitQueueNotFoundError.md#constructor)

### Properties

- [cause](QueueRateLimitQueueNotFoundError.md#cause)
- [message](QueueRateLimitQueueNotFoundError.md#message)
- [stack](QueueRateLimitQueueNotFoundError.md#stack)
- [prepareStackTrace](QueueRateLimitQueueNotFoundError.md#preparestacktrace)
- [stackTraceLimit](QueueRateLimitQueueNotFoundError.md#stacktracelimit)

### Accessors

- [name](QueueRateLimitQueueNotFoundError.md#name)

### Methods

- [captureStackTrace](QueueRateLimitQueueNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueRateLimitQueueNotFoundError**(`message?`)

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
