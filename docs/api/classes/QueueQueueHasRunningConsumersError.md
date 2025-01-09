[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueQueueHasRunningConsumersError

# Class: QueueQueueHasRunningConsumersError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueQueueHasRunningConsumersError`**

## Table of contents

### Constructors

- [constructor](QueueQueueHasRunningConsumersError.md#constructor)

### Properties

- [cause](QueueQueueHasRunningConsumersError.md#cause)
- [message](QueueQueueHasRunningConsumersError.md#message)
- [stack](QueueQueueHasRunningConsumersError.md#stack)
- [prepareStackTrace](QueueQueueHasRunningConsumersError.md#preparestacktrace)
- [stackTraceLimit](QueueQueueHasRunningConsumersError.md#stacktracelimit)

### Accessors

- [name](QueueQueueHasRunningConsumersError.md#name)

### Methods

- [captureStackTrace](QueueQueueHasRunningConsumersError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueQueueHasRunningConsumersError**(`message?`)

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
