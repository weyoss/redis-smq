[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueHasRunningConsumersError

# Class: QueueHasRunningConsumersError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueHasRunningConsumersError`**

## Table of contents

### Constructors

- [constructor](QueueHasRunningConsumersError.md#constructor)

### Properties

- [cause](QueueHasRunningConsumersError.md#cause)
- [message](QueueHasRunningConsumersError.md#message)
- [stack](QueueHasRunningConsumersError.md#stack)
- [prepareStackTrace](QueueHasRunningConsumersError.md#preparestacktrace)
- [stackTraceLimit](QueueHasRunningConsumersError.md#stacktracelimit)

### Accessors

- [name](QueueHasRunningConsumersError.md#name)

### Methods

- [captureStackTrace](QueueHasRunningConsumersError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueHasRunningConsumersError**(): [`QueueHasRunningConsumersError`](QueueHasRunningConsumersError.md)

#### Returns

[`QueueHasRunningConsumersError`](QueueHasRunningConsumersError.md)

#### Overrides

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
