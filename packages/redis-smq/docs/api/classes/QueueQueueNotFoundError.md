[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueQueueNotFoundError

# Class: QueueQueueNotFoundError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueQueueNotFoundError`**

## Table of contents

### Constructors

- [constructor](QueueQueueNotFoundError.md#constructor)

### Properties

- [cause](QueueQueueNotFoundError.md#cause)
- [message](QueueQueueNotFoundError.md#message)
- [stack](QueueQueueNotFoundError.md#stack)
- [prepareStackTrace](QueueQueueNotFoundError.md#preparestacktrace)
- [stackTraceLimit](QueueQueueNotFoundError.md#stacktracelimit)

### Accessors

- [name](QueueQueueNotFoundError.md#name)

### Methods

- [captureStackTrace](QueueQueueNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueQueueNotFoundError**(`message?`): [`QueueQueueNotFoundError`](QueueQueueNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueQueueNotFoundError`](QueueQueueNotFoundError.md)

#### Inherited from

[QueueError](QueueError.md).[constructor](QueueError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[QueueError](QueueError.md).[cause](QueueError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[QueueError](QueueError.md).[message](QueueError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[QueueError](QueueError.md).[stack](QueueError.md#stack)

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

[QueueError](QueueError.md).[prepareStackTrace](QueueError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[QueueError](QueueError.md).[stackTraceLimit](QueueError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

QueueError.name

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

[QueueError](QueueError.md).[captureStackTrace](QueueError.md#capturestacktrace)
