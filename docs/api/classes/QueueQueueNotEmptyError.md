[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueQueueNotEmptyError

# Class: QueueQueueNotEmptyError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueQueueNotEmptyError`**

## Table of contents

### Constructors

- [constructor](QueueQueueNotEmptyError.md#constructor)

### Properties

- [cause](QueueQueueNotEmptyError.md#cause)
- [message](QueueQueueNotEmptyError.md#message)
- [stack](QueueQueueNotEmptyError.md#stack)
- [prepareStackTrace](QueueQueueNotEmptyError.md#preparestacktrace)
- [stackTraceLimit](QueueQueueNotEmptyError.md#stacktracelimit)

### Accessors

- [name](QueueQueueNotEmptyError.md#name)

### Methods

- [captureStackTrace](QueueQueueNotEmptyError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueQueueNotEmptyError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

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

[QueueError](QueueError.md).[captureStackTrace](QueueError.md#capturestacktrace)
