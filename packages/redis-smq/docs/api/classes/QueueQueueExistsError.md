[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueQueueExistsError

# Class: QueueQueueExistsError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueQueueExistsError`**

## Table of contents

### Constructors

- [constructor](QueueQueueExistsError.md#constructor)

### Properties

- [cause](QueueQueueExistsError.md#cause)
- [message](QueueQueueExistsError.md#message)
- [stack](QueueQueueExistsError.md#stack)
- [prepareStackTrace](QueueQueueExistsError.md#preparestacktrace)
- [stackTraceLimit](QueueQueueExistsError.md#stacktracelimit)

### Accessors

- [name](QueueQueueExistsError.md#name)

### Methods

- [captureStackTrace](QueueQueueExistsError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueQueueExistsError**(`message?`): [`QueueQueueExistsError`](QueueQueueExistsError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueQueueExistsError`](QueueQueueExistsError.md)

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
