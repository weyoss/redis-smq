[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerInstanceNotRunningError

# Class: ProducerInstanceNotRunningError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerInstanceNotRunningError`**

## Table of contents

### Constructors

- [constructor](ProducerInstanceNotRunningError.md#constructor)

### Properties

- [cause](ProducerInstanceNotRunningError.md#cause)
- [message](ProducerInstanceNotRunningError.md#message)
- [stack](ProducerInstanceNotRunningError.md#stack)
- [prepareStackTrace](ProducerInstanceNotRunningError.md#preparestacktrace)
- [stackTraceLimit](ProducerInstanceNotRunningError.md#stacktracelimit)

### Accessors

- [name](ProducerInstanceNotRunningError.md#name)

### Methods

- [captureStackTrace](ProducerInstanceNotRunningError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerInstanceNotRunningError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

[ProducerError](ProducerError.md).[constructor](ProducerError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ProducerError](ProducerError.md).[cause](ProducerError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ProducerError](ProducerError.md).[message](ProducerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ProducerError](ProducerError.md).[stack](ProducerError.md#stack)

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

[ProducerError](ProducerError.md).[prepareStackTrace](ProducerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ProducerError](ProducerError.md).[stackTraceLimit](ProducerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ProducerError.name

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

[ProducerError](ProducerError.md).[captureStackTrace](ProducerError.md#capturestacktrace)
