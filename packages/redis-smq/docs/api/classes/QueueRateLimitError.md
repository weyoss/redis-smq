[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimitError

# Class: QueueRateLimitError

## Hierarchy

- `RedisSMQError`

  ↳ **`QueueRateLimitError`**

  ↳↳ [`QueueRateLimitInvalidIntervalError`](QueueRateLimitInvalidIntervalError.md)

  ↳↳ [`QueueRateLimitInvalidLimitError`](QueueRateLimitInvalidLimitError.md)

  ↳↳ [`QueueRateLimitQueueNotFoundError`](QueueRateLimitQueueNotFoundError.md)

## Table of contents

### Constructors

- [constructor](QueueRateLimitError.md#constructor)

### Properties

- [cause](QueueRateLimitError.md#cause)
- [message](QueueRateLimitError.md#message)
- [stack](QueueRateLimitError.md#stack)
- [prepareStackTrace](QueueRateLimitError.md#preparestacktrace)
- [stackTraceLimit](QueueRateLimitError.md#stacktracelimit)

### Accessors

- [name](QueueRateLimitError.md#name)

### Methods

- [captureStackTrace](QueueRateLimitError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueRateLimitError**(`message?`): [`QueueRateLimitError`](QueueRateLimitError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueRateLimitError`](QueueRateLimitError.md)

#### Inherited from

RedisSMQError.constructor

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

RedisSMQError.cause

___

### message

• **message**: `string`

#### Inherited from

RedisSMQError.message

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

RedisSMQError.stack

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

RedisSMQError.prepareStackTrace

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

RedisSMQError.stackTraceLimit

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

RedisSMQError.name

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

RedisSMQError.captureStackTrace
